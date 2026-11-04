export type Service = {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  durationMinutes: number;
  imageUrl: string | null;
  active: boolean;
  sortOrder: number;
};
export type Professional = {
  id: string;
  name: string;
  specialty: string;
  imageUrl: string | null;
  active: boolean;
  sortOrder: number;
  serviceIds: string[];
};
export type BookingStatus = "confirmed" | "cancelled" | "completed" | "no_show";
export type Slot = { startsAt: string; endsAt: string; professionalId: string };
export type BookingInput = {
  serviceId: string;
  professionalId: string | null;
  startsAt: string;
  customer: { name: string; phone: string; email?: string };
  consent: true;
};
export type BookingReceipt = {
  code: string;
  managementToken: string;
  startsAt: string;
  serviceName: string;
  professionalName: string;
  priceCents: number;
  durationMinutes: number;
};
export type ApiErrorCode =
  | "VALIDATION"
  | "CONFLICT"
  | "UNAUTHORIZED"
  | "RATE_LIMITED"
  | "UNAVAILABLE"
  | "TOO_LATE"
  | "NOT_FOUND";
export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: ApiErrorCode; message: string } };
export type SiteSettings = {
  topbarTagline: string;
  heroSignatureTitle: string;
  heroSignatureText: string;
  servicesEyebrow: string;
  servicesDescription: string;
  bookingEyebrow: string;
  bookingImage: string;
  stepsEyebrow: string;
  stepsTitle: string;
  teamEyebrow: string;
  teamDescription: string;
  teamIntroImage: string;
  teamIntroTitle: string;
  teamIntroDescription: string;
  teamIntroNote: string;
  testimonialsEyebrow: string;
  contactEyebrow: string;
  contactTitle: string;
  contactHeading: string;
  footerSlogan: string;
  headerCta: string;
  heroPrimaryCta: string;
  heroSecondaryCta: string;
  serviceCta: string;
  bookingCta: string;
  teamCta: string;
  contactCta: string;
  steps: { title: string; description: string }[];

  brandName: string;
  promotion: string;
  promotionActive: boolean;
  eyebrow: string;
  heroTitle: string;
  heroDescription: string;
  heroImage: string;
  logoUrl: string;
  servicesTitle: string;
  bookingTitle: string;
  bookingDescription: string;
  teamTitle: string;
  testimonialsTitle: string;
  footerText: string;
  benefits: string[];
  address: string;
  phone: string;
  email: string;
  instagram: string;
  facebook: string;
  hoursText: string;
  locationImage: string;
  testimonials: { name: string; text: string }[];
  showTeam: boolean;
  showTestimonials: boolean;
  showLocation: boolean;
  bookingEnabled: boolean;
  leadMinutes: number;
  horizonDays: number;
  stepMinutes: number;
  cancelHours: number;
};
export type PublicContent = {
  settings: SiteSettings;
  services: Service[];
  professionals: Professional[];
  configured: boolean;
  demo?: boolean;
};
export type BookingView = {
  id: string;
  code: string;
  startsAt: string;
  endsAt: string;
  serviceId: string;
  professionalId: string;
  serviceName: string;
  professionalName: string;
  priceCents: number;
  durationMinutes: number;
  status: BookingStatus;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
};
