export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.4";
  };
  public: {
    Tables: {
      booking_blocks: {
        Row: {
          campsite_unit_id: string;
          created_at: string;
          created_by: string | null;
          end_date: string;
          id: string;
          reason: string | null;
          start_date: string;
          updated_at: string;
        };
        Insert: {
          campsite_unit_id: string;
          created_at?: string;
          created_by?: string | null;
          end_date: string;
          id?: string;
          reason?: string | null;
          start_date: string;
          updated_at?: string;
        };
        Update: {
          campsite_unit_id?: string;
          created_at?: string;
          created_by?: string | null;
          end_date?: string;
          id?: string;
          reason?: string | null;
          start_date?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "booking_blocks_campsite_unit_id_fkey";
            columns: ["campsite_unit_id"];
            isOneToOne: false;
            referencedRelation: "campsite_units";
            referencedColumns: ["id"];
          }
        ];
      };
      booking_units: {
        Row: {
          booking_id: string;
          campsite_unit_id: string;
          created_at: string;
          end_date: string;
          id: string;
          start_date: string;
          updated_at: string;
        };
        Insert: {
          booking_id: string;
          campsite_unit_id: string;
          created_at?: string;
          end_date: string;
          id?: string;
          start_date: string;
          updated_at?: string;
        };
        Update: {
          booking_id?: string;
          campsite_unit_id?: string;
          created_at?: string;
          end_date?: string;
          id?: string;
          start_date?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "booking_units_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "booking_units_campsite_unit_id_fkey";
            columns: ["campsite_unit_id"];
            isOneToOne: false;
            referencedRelation: "campsite_units";
            referencedColumns: ["id"];
          }
        ];
      };
      bookings: {
        Row: {
          admin_notes: string | null;
          adult_guests_count: number;
          booking_reference: string;
          campsite_unit_id: string | null;
          check_in_date: string;
          check_out_date: string;
          child_guests_count: number;
          created_at: string;
          currency: string;
          fees_amount: number;
          guest_email: string;
          guest_first_name: string;
          guest_last_name: string;
          guest_phone: string | null;
          guests_count: number;
          id: string;
          nights: number;
          notes: string | null;
          payment_status: Database["public"]["Enums"]["payment_status"];
          requested_unit_count: number;
          status: Database["public"]["Enums"]["booking_status"];
          subtotal_amount: number;
          total_amount: number;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          admin_notes?: string | null;
          adult_guests_count?: number;
          booking_reference?: string;
          campsite_unit_id?: string | null;
          check_in_date: string;
          check_out_date: string;
          child_guests_count?: number;
          created_at?: string;
          currency?: string;
          fees_amount?: number;
          guest_email: string;
          guest_first_name: string;
          guest_last_name: string;
          guest_phone?: string | null;
          guests_count: number;
          id?: string;
          nights: number;
          notes?: string | null;
          payment_status?: Database["public"]["Enums"]["payment_status"];
          requested_unit_count?: number;
          status?: Database["public"]["Enums"]["booking_status"];
          subtotal_amount: number;
          total_amount: number;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          admin_notes?: string | null;
          adult_guests_count?: number;
          booking_reference?: string;
          campsite_unit_id?: string | null;
          check_in_date?: string;
          check_out_date?: string;
          child_guests_count?: number;
          created_at?: string;
          currency?: string;
          fees_amount?: number;
          guest_email?: string;
          guest_first_name?: string;
          guest_last_name?: string;
          guest_phone?: string | null;
          guests_count?: number;
          id?: string;
          nights?: number;
          notes?: string | null;
          payment_status?: Database["public"]["Enums"]["payment_status"];
          requested_unit_count?: number;
          status?: Database["public"]["Enums"]["booking_status"];
          subtotal_amount?: number;
          total_amount?: number;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "bookings_campsite_unit_id_fkey";
            columns: ["campsite_unit_id"];
            isOneToOne: false;
            referencedRelation: "campsite_units";
            referencedColumns: ["id"];
          }
        ];
      };
      campsite_units: {
        Row: {
          active: boolean;
          base_price_per_night: number;
          child_price_per_night: number;
          cleaning_fee: number | null;
          cover_image_url: string | null;
          created_at: string;
          description: string | null;
          id: string;
          max_guests: number;
          name: string;
          short_description: string | null;
          slug: string;
          type: string;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          base_price_per_night: number;
          child_price_per_night?: number;
          cleaning_fee?: number | null;
          cover_image_url?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          max_guests: number;
          name: string;
          short_description?: string | null;
          slug: string;
          type: string;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          base_price_per_night?: number;
          child_price_per_night?: number;
          cleaning_fee?: number | null;
          cover_image_url?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          max_guests?: number;
          name?: string;
          short_description?: string | null;
          slug?: string;
          type?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          full_name: string | null;
          id: string;
          role: Database["public"]["Enums"]["profile_role"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          full_name?: string | null;
          id: string;
          role?: Database["public"]["Enums"]["profile_role"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          full_name?: string | null;
          id?: string;
          role?: Database["public"]["Enums"]["profile_role"];
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      admin_confirm_booking: {
        Args: { p_admin_notes?: string; p_booking_id: string };
        Returns: {
          admin_notes: string | null;
          adult_guests_count: number;
          booking_reference: string;
          campsite_unit_id: string;
          check_in_date: string;
          check_out_date: string;
          child_guests_count: number;
          created_at: string;
          currency: string;
          fees_amount: number;
          guest_email: string;
          guest_first_name: string;
          guest_last_name: string;
          guest_phone: string | null;
          guests_count: number;
          id: string;
          nights: number;
          notes: string | null;
          payment_status: Database["public"]["Enums"]["payment_status"];
          status: Database["public"]["Enums"]["booking_status"];
          subtotal_amount: number;
          total_amount: number;
          updated_at: string;
          user_id: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "bookings";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      create_booking_request: {
        Args: {
          p_adult_guests_count: number;
          p_check_in_date: string;
          p_check_out_date: string;
          p_child_guests_count: number;
          p_guest_email: string;
          p_guest_first_name: string;
          p_guest_last_name: string;
          p_guest_phone: string;
          p_notes?: string;
          p_requested_unit_count: number;
        };
        Returns: {
          booking_id: string;
          booking_reference: string;
          status: Database["public"]["Enums"]["booking_status"];
        }[];
      };
      get_available_campsite_units: {
        Args: { p_check_in: string; p_check_out: string };
        Returns: {
          cover_image_url: string;
          id: string;
          name: string;
          slug: string;
        }[];
      };
      generate_booking_reference: { Args: never; Returns: string };
      get_unit_conflicts: {
        Args: {
          p_campsite_unit_id: string;
          p_check_in: string;
          p_check_out: string;
          p_exclude_booking_id?: string;
        };
        Returns: {
          booking_status: Database["public"]["Enums"]["booking_status"];
          conflict_id: string;
          conflict_source: string;
          end_date: string;
          reason: string;
          start_date: string;
        }[];
      };
      half_open_intervals_overlap: {
        Args: {
          left_end: string;
          left_start: string;
          right_end: string;
          right_start: string;
        };
        Returns: boolean;
      };
      is_admin: { Args: never; Returns: boolean };
      is_unit_available: {
        Args: {
          p_campsite_unit_id: string;
          p_check_in: string;
          p_check_out: string;
          p_exclude_booking_id?: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      booking_status: "pending" | "confirmed" | "rejected" | "cancelled";
      payment_status: "unpaid" | "paid" | "refunded" | "partially_refunded";
      profile_role: "admin" | "customer";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;
type DefaultSchema = DatabaseWithoutInternals["public"];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer Row;
    }
    ? Row
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer Row;
      }
      ? Row
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer Insert;
    }
    ? Insert
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer Insert;
      }
      ? Insert
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer Update;
    }
    ? Update
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer Update;
      }
      ? Update
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      booking_status: ["pending", "confirmed", "rejected", "cancelled"],
      payment_status: ["unpaid", "paid", "refunded", "partially_refunded"],
      profile_role: ["admin", "customer"]
    }
  }
} as const;
