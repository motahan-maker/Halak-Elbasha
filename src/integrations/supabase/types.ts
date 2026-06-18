export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      barbers: {
        Row: {
          break_end: string | null;
          break_start: string | null;
          created_at: string;
          end_time: string;
          id: string;
          is_active: boolean;
          name: string;
          phone: string;
          slot_minutes: number;
          specialization: string | null;
          start_time: string;
          user_id: string | null;
          working_days: number[];
        };
        Insert: {
          break_end?: string | null;
          break_start?: string | null;
          created_at?: string;
          end_time?: string;
          id?: string;
          is_active?: boolean;
          name: string;
          phone: string;
          slot_minutes?: number;
          specialization?: string | null;
          start_time?: string;
          user_id?: string | null;
          working_days?: number[];
        };
        Update: {
          break_end?: string | null;
          break_start?: string | null;
          created_at?: string;
          end_time?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          phone?: string;
          slot_minutes?: number;
          specialization?: string | null;
          start_time?: string;
          user_id?: string | null;
          working_days?: number[];
        };
        Relationships: [];
      };
      bookings: {
        Row: {
          barber_id: string;
          booking_date: string;
          booking_number: string | null;
          booking_time: string;
          created_at: string;
          customer_id: string;
          customer_name: string;
          customer_phone: string;
          id: string;
          service_id: string;
          service_name: string;
          service_price: number;
          status: Database["public"]["Enums"]["booking_status"];
        };
        Insert: {
          barber_id: string;
          booking_date: string;
          booking_number?: string | null;
          booking_time: string;
          created_at?: string;
          customer_id: string;
          customer_name: string;
          customer_phone: string;
          id?: string;
          service_id: string;
          service_name: string;
          service_price?: number;
          status?: Database["public"]["Enums"]["booking_status"];
        };
        Update: {
          barber_id?: string;
          booking_date?: string;
          booking_number?: string | null;
          booking_time?: string;
          created_at?: string;
          customer_id?: string;
          customer_name?: string;
          customer_phone?: string;
          id?: string;
          service_id?: string;
          service_name?: string;
          service_price?: number;
          status?: Database["public"]["Enums"]["booking_status"];
        };
        Relationships: [
          {
            foreignKeyName: "bookings_barber_id_fkey";
            columns: ["barber_id"];
            isOneToOne: false;
            referencedRelation: "barbers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
        ];
      };
      offers: {
        Row: {
          created_at: string;
          description: string | null;
          discount_percent: number | null;
          id: string;
          is_active: boolean;
          title: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          discount_percent?: number | null;
          id?: string;
          is_active?: boolean;
          title: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          discount_percent?: number | null;
          id?: string;
          is_active?: boolean;
          title?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          full_name: string;
          id: string;
          phone: string;
        };
        Insert: {
          created_at?: string;
          full_name: string;
          id: string;
          phone: string;
        };
        Update: {
          created_at?: string;
          full_name?: string;
          id?: string;
          phone?: string;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          barber_id: string;
          booking_id: string | null;
          comment: string | null;
          created_at: string;
          customer_id: string;
          customer_name: string;
          id: string;
          rating: number;
        };
        Insert: {
          barber_id: string;
          booking_id?: string | null;
          comment?: string | null;
          created_at?: string;
          customer_id: string;
          customer_name: string;
          id?: string;
          rating: number;
        };
        Update: {
          barber_id?: string;
          booking_id?: string | null;
          comment?: string | null;
          created_at?: string;
          customer_id?: string;
          customer_name?: string;
          id?: string;
          rating?: number;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_barber_id_fkey";
            columns: ["barber_id"];
            isOneToOne: false;
            referencedRelation: "barbers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
        ];
      };
      services: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          is_active: boolean;
          name: string;
          price: number;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          price?: number;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          price?: number;
        };
        Relationships: [];
      };
      settings: {
        Row: {
          address: string | null;
          break_end: string | null;
          break_start: string | null;
          end_time: string;
          facebook: string | null;
          id: number;
          instagram: string | null;
          shop_name: string;
          slot_minutes: number;
          start_time: string;
          tiktok: string | null;
          updated_at: string;
          whatsapp: string | null;
          working_days: number[];
        };
        Insert: {
          address?: string | null;
          break_end?: string | null;
          break_start?: string | null;
          end_time?: string;
          facebook?: string | null;
          id?: number;
          instagram?: string | null;
          shop_name?: string;
          slot_minutes?: number;
          start_time?: string;
          tiktok?: string | null;
          updated_at?: string;
          whatsapp?: string | null;
          working_days?: number[];
        };
        Update: {
          address?: string | null;
          break_end?: string | null;
          break_start?: string | null;
          end_time?: string;
          facebook?: string | null;
          id?: number;
          instagram?: string | null;
          shop_name?: string;
          slot_minutes?: number;
          start_time?: string;
          tiktok?: string | null;
          updated_at?: string;
          whatsapp?: string | null;
          working_days?: number[];
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_booking: {
        Args: {
          _barber_id: string;
          _booking_date: string;
          _booking_time: string;
          _service_id: string;
        };
        Returns: {
          barber_id: string;
          booking_date: string;
          booking_number: string | null;
          booking_time: string;
          created_at: string;
          customer_id: string;
          customer_name: string;
          customer_phone: string;
          id: string;
          service_id: string;
          service_name: string;
          service_price: number;
          status: Database["public"]["Enums"]["booking_status"];
        };
        SetofOptions: {
          from: "*";
          to: "bookings";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      current_user_role: {
        Args: never;
        Returns: Database["public"]["Enums"]["app_role"];
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "admin" | "barber" | "customer";
      booking_status: "booked" | "completed" | "cancelled";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
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
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "barber", "customer"],
      booking_status: ["booked", "completed", "cancelled"],
    },
  },
} as const;
