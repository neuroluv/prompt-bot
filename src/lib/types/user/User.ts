export interface User {
  id: bigint;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_bot: boolean;
  is_premium: boolean;
  photo_url?: string;
}
