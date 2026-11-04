import { Pool } from "pg";
import { readFileSync, readdirSync } from "node:fs";
import { beforeAll, afterAll, beforeEach, describe, it, expect } from "vitest";
const pool = new Pool({
  connectionString:
    process.env.TEST_DATABASE_URL ||
    "postgresql://postgres@127.0.0.1:54328/imperial_test",
});
const sid = "11111111-1111-4111-8111-111111111111",
  pid = "22222222-2222-4222-8222-222222222222";
let start: string;
const input = (at = start) => ({
  serviceId: sid,
  professionalId: pid,
  startsAt: at,
  customer: { name: "Cliente teste", phone: "11999998888" },
  consent: true,
});
const book = async (at = start, professionalId: string | null = pid) =>
  pool.query("select create_booking($1,$2) b", [
    { ...input(at), professionalId },
    "a".repeat(64),
  ]);
beforeAll(async () => {
  const name = await pool.query("select current_database() n");
  if (name.rows[0].n !== "imperial_test")
    throw Error("Only imperial_test may be reset");
  await pool.query(`drop schema public cascade;create schema public;grant usage on schema public to public;
 do $$begin create role anon nologin;exception when duplicate_object then null;end$$;
 do $$begin create role authenticated nologin;exception when duplicate_object then null;end$$;
 do $$begin create role service_role nologin bypassrls;exception when duplicate_object then null;end$$;
 alter default privileges in schema public grant execute on functions to anon,authenticated,service_role;
 create schema if not exists auth;create table if not exists auth.users(id uuid primary key);
 create or replace function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;
 drop schema if exists storage cascade;create schema storage; create table if not exists storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table if not exists storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;
 `);
  for (const file of readdirSync("supabase/migrations")
    .filter((f) => f.endsWith(".sql"))
    .sort())
    await pool.query(readFileSync("supabase/migrations/" + file, "utf8"));
});
afterAll(() => pool.end());
beforeEach(async () => {
  await pool.query(
    `truncate bookings,customers,working_hours,schedule_blocks,professional_services,professionals,services,admin_users,request_limits cascade`,
  );
  await pool.query(
    `update site_settings set content=content||'{"bookingEnabled":true}'::jsonb`,
  );
  await pool.query(
    `insert into services(id,name,price_cents,duration_minutes) values($1,'Corte',4000,30)`,
    [sid],
  );
  await pool.query(`insert into professionals(id,name) values($1,'Barbeiro')`, [
    pid,
  ]);
  await pool.query("insert into professional_services values($1,$2)", [
    pid,
    sid,
  ]);
  await pool.query(
    `insert into working_hours(professional_id,weekday,opens,closes) select $1,d,'09:00','20:00' from generate_series(0,6)d`,
    [pid],
  );
  const d = await pool.query(
    `select (((now() at time zone 'America/Sao_Paulo')::date+2)+time '10:00') at time zone 'America/Sao_Paulo' t`,
  );
  start = d.rows[0].t.toISOString();
});
describe("booking database behavior", () => {
  it("persists snapshots and allows adjacent intervals", async () => {
    await book();
    await book(new Date(Date.parse(start) + 30 * 60000).toISOString());
    await pool.query(
      "update services set price_cents=8000,duration_minutes=60",
    );
    const { rows } = await pool.query(
      "select price_cents,duration_minutes from bookings",
    );
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ price_cents: 4000, duration_minutes: 30 });
  });
  it("permits only one concurrent reservation", async () => {
    const r = await Promise.allSettled([book(), book()]);
    expect(r.filter((x) => x.status === "fulfilled")).toHaveLength(1);
  });
  it("permits only one concurrent any-professional reservation", async () => {
    const r = await Promise.allSettled([book(start, null), book(start, null)]);
    expect(r.filter((x) => x.status === "fulfilled")).toHaveLength(1);
  });
  it("rejects a service crossing a block or the working day", async () => {
    await pool.query(
      `insert into schedule_blocks(professional_id,starts_at,ends_at,reason)values($1,$2,$3,'Pausa')`,
      [
        pid,
        new Date(Date.parse(start) + 10 * 60000),
        new Date(Date.parse(start) + 60 * 60000),
      ],
    );
    await expect(book()).rejects.toThrow();
    const late = new Date(start);
    late.setUTCHours(22, 50);
    await expect(book(late.toISOString())).rejects.toThrow();
  });
  it("rejects inactive or unqualified professionals", async () => {
    await pool.query("update professionals set active=false");
    await expect(book()).rejects.toThrow();
    await pool.query(
      "update professionals set active=true;delete from professional_services",
    );
    await expect(book()).rejects.toThrow();
  });
  it("rejects short notice, old dates and dates beyond 60 days", async () => {
    for (const delta of [-60, 10, 61 * 24 * 60])
      await expect(
        book(new Date(Date.now() + delta * 60000).toISOString()),
      ).rejects.toThrow();
  });
  it("rejects non-grid times", async () =>
    await expect(
      book(new Date(Date.parse(start) + 5 * 60000).toISOString()),
    ).rejects.toThrow());
  it("keeps original booking when rescheduling conflicts", async () => {
    await book();
    await book(new Date(Date.parse(start) + 30 * 60000).toISOString());
    await expect(
      pool.query(`select manage_booking($1,'reschedule',$2)`, [
        "a".repeat(64),
        new Date(Date.parse(start) + 30 * 60000),
      ]),
    ).rejects.toThrow();
    const r = await pool.query(
      "select starts_at from bookings order by starts_at",
    );
    expect(r.rows[0].starts_at.toISOString()).toBe(start);
  });
  it("allows token cancellation and rejects wrong token", async () => {
    await book();
    await expect(
      pool.query(`select manage_booking($1,'view',null)`, ["b".repeat(64)]),
    ).rejects.toThrow();
    await pool.query(`select manage_booking($1,'cancel',null)`, [
      "a".repeat(64),
    ]);
    expect(
      (await pool.query("select status from bookings")).rows[0].status,
    ).toBe("cancelled");
  });
  it("blocks late client cancellation", async () => {
    await book();
    await pool.query(
      `update bookings set starts_at=now()+interval '1 hour',ends_at=now()+interval '90 minutes'`,
    );
    await expect(
      pool.query(`select manage_booking($1,'cancel',null)`, ["a".repeat(64)]),
    ).rejects.toThrow();
  });
  it("hides private tables and privileged RPCs from visitors", async () => {
    await book();
    const c = await pool.connect();
    try {
      await c.query("set role anon");
      expect((await c.query("select * from bookings")).rows).toHaveLength(0);
      expect((await c.query("select * from customers")).rows).toHaveLength(0);
      await expect(
        c.query("select create_booking($1,$2)", [input(), "c".repeat(64)]),
      ).rejects.toThrow();
    } finally {
      await c.query("reset role");
      c.release();
    }
  });
  it("denies normal authenticated mutations and permits configured admin", async () => {
    const uid = "33333333-3333-4333-8333-333333333333";
    await pool.query(
      "insert into auth.users(id)values($1)on conflict do nothing",
      [uid],
    );
    const c = await pool.connect();
    try {
      await c.query("set role authenticated");
      await c.query(`select set_config('request.jwt.claim.sub',$1,false)`, [
        uid,
      ]);
      await expect(
        c.query(
          `insert into services(name,price_cents,duration_minutes)values('Evil',1,30)`,
        ),
      ).rejects.toThrow();
      await c.query("reset role");
      await pool.query("insert into admin_users(user_id)values($1)", [uid]);
      await c.query("set role authenticated");
      await c.query(
        `insert into services(name,price_cents,duration_minutes)values('Admin',1,30)`,
      );
      expect(
        (await c.query(`select name from services where name='Admin'`))
          .rowCount,
      ).toBe(1);
    } finally {
      await c.query("reset role");
      c.release();
    }
  });
  it("rejects schedule changes invalidating an appointment", async () => {
    await book();
    await expect(
      pool.query("select save_schedule($1,$2,$3)", [pid, [], []]),
    ).rejects.toThrow();
    expect((await pool.query("select * from working_hours")).rowCount).toBe(7);
  });
  it("allows cancellation exactly two hours before using database time", async () => {
    await book();
    const c = await pool.connect();
    try {
      await c.query("begin");
      await c.query(
        "update bookings set starts_at=now()+interval '2 hours',ends_at=now()+interval '150 minutes'",
      );
      await c.query("select manage_booking($1,'cancel',null)", [
        "a".repeat(64),
      ]);
      await c.query("commit");
      expect(
        (await pool.query("select status from bookings")).rows[0].status,
      ).toBe("cancelled");
    } catch (e) {
      await c.query("rollback");
      throw e;
    } finally {
      c.release();
    }
  });
  it("offers rescheduling using original duration after catalog edits", async () => {
    await book();
    await pool.query("update services set duration_minutes=60,active=false");
    const d = start.slice(0, 10);
    const r = await pool.query("select list_booking_slots($1,$2) slots", [
      "a".repeat(64),
      d,
    ]);
    expect(
      r.rows[0].slots.some(
        (s: { startsAt: string; endsAt: string }) =>
          Date.parse(s.endsAt) - Date.parse(s.startsAt) === 30 * 60000,
      ),
    ).toBe(true);
  });
  it("groups a customer history by phone without modifying earlier identities", async () => {
    await book();
    await book(new Date(Date.parse(start) + 60 * 60000).toISOString());
    const uid = "33333333-3333-4333-8333-333333333333";
    await pool.query(
      "insert into auth.users(id)values($1)on conflict do nothing",
      [uid],
    );
    await pool.query("insert into admin_users(user_id)values($1)", [uid]);
    const c = await pool.connect();
    try {
      await c.query("select set_config('request.jwt.claim.sub',$1,false)", [
        uid,
      ]);
      const row = await c.query("select customer_id from bookings limit 1");
      const r = await c.query(
        "select admin_list_bookings(null,null,$1,null,0) result",
        [row.rows[0].customer_id],
      );
      expect(r.rows[0].result.total).toBe(2);
      const customers = await c.query(
        "select admin_list_customers('',0) result",
      );
      expect(customers.rows[0].result.total).toBe(1);
    } finally {
      c.release();
    }
  });
  it("does not let an admin move a completed appointment into the future", async () => {
    await book();
    await pool.query(
      "update bookings set status='completed',starts_at=now()-interval '60 minutes',ends_at=now()-interval '30 minutes'",
    );
    const uid = "33333333-3333-4333-8333-333333333333";
    await pool.query(
      "insert into auth.users(id)values($1)on conflict do nothing",
      [uid],
    );
    await pool.query("insert into admin_users(user_id)values($1)", [uid]);
    const c = await pool.connect();
    try {
      await c.query("select set_config('request.jwt.claim.sub',$1,false)", [
        uid,
      ]);
      const b = await c.query("select id from bookings");
      await expect(
        c.query("select admin_update_booking($1,$2)", [
          b.rows[0].id,
          { startsAt: start, status: "completed" },
        ]),
      ).rejects.toThrow();
    } finally {
      c.release();
    }
  });
  it("requires explicit customer consent in the privileged booking function", async () => {
    const { consent, ...withoutConsent } = input();
    await expect(
      pool.query("select create_booking($1,$2)", [
        withoutConsent,
        "f".repeat(64),
      ]),
    ).rejects.toThrow();
  });
  it("allows manual bookings while public online reservations are closed", async () => {
    await pool.query(
      `update site_settings set content=content||'{"bookingEnabled":false}'::jsonb`,
    );
    const uid = "33333333-3333-4333-8333-333333333333";
    await pool.query(
      "insert into auth.users(id)values($1)on conflict do nothing",
      [uid],
    );
    await pool.query("insert into admin_users(user_id)values($1)", [uid]);
    const c = await pool.connect();
    try {
      await c.query("select set_config('request.jwt.claim.sub',$1,false)", [
        uid,
      ]);
      await c.query("select admin_create_booking($1)", [input()]);
      expect((await c.query("select *from bookings")).rowCount).toBe(1);
      await expect(
        book(new Date(Date.parse(start) + 60 * 60000).toISOString()),
      ).rejects.toThrow();
    } finally {
      c.release();
    }
  });

  it("revokes Supabase-default EXECUTE from privileged functions for public roles", async () => {
    for (const role of ["anon", "authenticated"])
      for (const signature of [
        "save_schedule(uuid,jsonb,jsonb)",
        "create_booking_internal(jsonb,text,boolean)",
        "create_booking(jsonb,text)",
        "manage_booking(text,text,timestamp with time zone)",
        "consume_limit(text,integer,integer)",
        "list_booking_slots(text,date)",
      ]) {
        const r = await pool.query(
          "select has_function_privilege($1,$2,'execute') allowed",
          [role, "public." + signature],
        );
        expect(r.rows[0].allowed, role + ":" + signature).toBe(false);
      }
  });
});
