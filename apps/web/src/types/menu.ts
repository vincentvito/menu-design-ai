export type MenuStatus =
  | "draft"
  | "ocr_processing"
  | "ocr_complete"
  | "editing"
  | "style_selected"
  | "generating_samples"
  | "samples_ready"
  | "sample_selected"
  | "payment_pending"
  | "paid"
  | "design_in_progress"
  | "design_complete"
  | "delivered"
  | "failed";

export type MenuFormat = "photo" | "balanced" | "text_only";
export type PageLayout = "single" | "front_back" | "booklet";

export type UserRole = "customer" | "qc_reviewer" | "admin";

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  company_name: string | null;
  role: UserRole;
  locale: "en" | "ar";
  stripe_customer_id: string | null;
  created_at: string;
}

export interface MenuItem {
  id: string;
  section_id: string;
  menu_id: string;
  name_en: string;
  name_ar: string | null;
  description_en: string | null;
  description_ar: string | null;
  price: number;
  currency: string;
  price_variants: { label: string; price: number }[] | null;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  is_spicy: boolean;
  is_halal: boolean;
  sort_order: number;
  is_featured: boolean;
}

export interface MenuSection {
  id: string;
  menu_id: string;
  name_en: string;
  name_ar: string | null;
  description_en: string | null;
  description_ar: string | null;
  sort_order: number;
  items: MenuItem[];
}

export interface Menu {
  id: string;
  user_id: string;
  status: MenuStatus;
  input_method: "upload" | "text_paste";
  original_image_url: string | null;
  original_filename: string | null;
  raw_text_input: string | null;
  restaurant_name: string | null;
  cuisine_type: string | null;
  locale: "en" | "ar";
  extracted_json: MenuData | null;
  edited_json: MenuData | null;
  menu_format: MenuFormat | null;
  page_layout: PageLayout | null;
  color_palette: string[] | null;
  template_id: string | null;
  selected_generation_id: string | null;
  selected_image_id: string | null;
  final_deliverable_urls: string[] | null;
  background_image_url: string | null;
  preview_pdf_url: string | null;
  final_pdf_url: string | null;
  page_count: number;
  paper_size: string;
  created_at: string;
  updated_at: string;
}

export interface MenuData {
  restaurant_name: string;
  sections: {
    name: string;
    name_ar?: string;
    items: {
      name: string;
      name_ar?: string;
      description?: string;
      description_ar?: string;
      price: number;
      currency: string;
      is_vegetarian?: boolean;
      is_vegan?: boolean;
      is_gluten_free?: boolean;
      is_spicy?: boolean;
      is_halal?: boolean;
    }[];
  }[];
}

export interface StyleTemplate {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  preview_url: string | null;
  color_scheme: Record<string, string> | null;
  font_config: Record<string, string> | null;
  supports_rtl: boolean;
  example_images: string[] | null;
  base_prompt_context: string | null;
}

export interface CuisineType {
  id: string;
  slug: string;
  name: string;
  name_ar: string | null;
  icon: string | null;
  description: string | null;
  prompt_modifier: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface AIGeneration {
  id: string;
  menu_id: string;
  user_id: string;
  style_template_id: string | null;
  cuisine_type: string;
  status: "pending" | "generating" | "completed" | "failed";
  provider: string;
  model_id: string;
  total_cost_usd: number | null;
  parent_generation_id: string | null;
  source_image_id: string | null;
  variation_instructions: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface AIGenerationImage {
  id: string;
  generation_id: string;
  variant_index: number;
  prompt_text: string;
  image_url: string | null;
  provider_prediction_id: string | null;
  status: "pending" | "generating" | "completed" | "failed";
  error_message: string | null;
  duration_ms: number | null;
  cost_usd: number | null;
  created_at: string;
  completed_at: string | null;
}

export interface UserCredits {
  id: string;
  user_id: string;
  balance: number;
  lifetime_earned: number;
  lifetime_spent: number;
  created_at: string;
  updated_at: string;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  balance_after: number;
  type: "signup_bonus" | "purchase" | "generation" | "refund" | "admin_grant";
  description: string | null;
  stripe_payment_intent: string | null;
  menu_id: string | null;
  generation_id: string | null;
  created_at: string;
}

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price_usd: number;
  stripe_price_id: string | null;
  is_popular: boolean;
  is_active: boolean;
  sort_order: number;
}

export interface ColorPalette {
  id: string;
  style_template_id: string;
  name: string;
  slug: string;
  colors: string[];
  is_default: boolean;
  sort_order: number;
  is_active: boolean;
}

export interface PromptTemplate {
  id: string;
  style_template_id: string;
  cuisine_type: string;
  variant_index: number;
  prompt_template: string;
  aspect_ratio: string;
  description: string | null;
  is_active: boolean;
}

export interface Order {
  id: string;
  menu_id: string;
  user_id: string;
  stripe_session_id: string | null;
  amount: number;
  currency: string;
  status: "pending" | "checkout_created" | "paid" | "refunded" | "failed";
  generation_id: string | null;
  selected_image_id: string | null;
  created_at: string;
  paid_at: string | null;
}

export interface QCReview {
  id: string;
  menu_id: string;
  reviewer_id: string | null;
  status: "pending" | "in_review" | "approved" | "rejected" | "revision_requested";
  notes: string | null;
  rejection_reason: string | null;
  check_prices: boolean | null;
  check_names: boolean | null;
  check_layout: boolean | null;
  check_images: boolean | null;
  check_rtl: boolean | null;
  created_at: string;
}
