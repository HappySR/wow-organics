// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

declare module '$env/static/private' {
  export const RESEND_API_KEY: string;
  export const RAZORPAY_KEY_ID: string;
  export const RAZORPAY_KEY_SECRET: string;
  export const SUPABASE_SERVICE_ROLE_KEY: string;
}

export {};
