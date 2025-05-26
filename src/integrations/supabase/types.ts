export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      fertility: {
        Row: {
          fertility_rate: number | null
          geo: string
          id: number
          year: number
        }
        Insert: {
          fertility_rate?: number | null
          geo: string
          id?: number
          year: number
        }
        Update: {
          fertility_rate?: number | null
          geo?: string
          id?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "fertility_geo_fkey"
            columns: ["geo"]
            isOneToOne: false
            referencedRelation: "geo_data"
            referencedColumns: ["geo"]
          },
        ]
      }
      geo_data: {
        Row: {
          geo: string
          latitude: number | null
          longitude: number | null
          un_region: string | null
        }
        Insert: {
          geo: string
          latitude?: number | null
          longitude?: number | null
          un_region?: string | null
        }
        Update: {
          geo?: string
          latitude?: number | null
          longitude?: number | null
          un_region?: string | null
        }
        Relationships: []
      }
      labor: {
        Row: {
          geo: string
          id: number
          labour_force: number | null
          sex: string
          year: number
        }
        Insert: {
          geo: string
          id?: number
          labour_force?: number | null
          sex: string
          year: number
        }
        Update: {
          geo?: string
          id?: number
          labour_force?: number | null
          sex?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "labor_geo_fkey"
            columns: ["geo"]
            isOneToOne: false
            referencedRelation: "geo_data"
            referencedColumns: ["geo"]
          },
        ]
      }
      population: {
        Row: {
          age: string
          geo: string
          id: number
          population: number | null
          sex: string
          year: number
        }
        Insert: {
          age: string
          geo: string
          id?: number
          population?: number | null
          sex: string
          year: number
        }
        Update: {
          age?: string
          geo?: string
          id?: number
          population?: number | null
          sex?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "population_geo_fkey"
            columns: ["geo"]
            isOneToOne: false
            referencedRelation: "geo_data"
            referencedColumns: ["geo"]
          },
        ]
      }
      predictions: {
        Row: {
          geo: string | null
          ID: number
          predicted_labour_force: number | null
          time_period: number | null
        }
        Insert: {
          geo?: string | null
          ID: number
          predicted_labour_force?: number | null
          time_period?: number | null
        }
        Update: {
          geo?: string | null
          ID?: number
          predicted_labour_force?: number | null
          time_period?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "predictions_geo_fkey"
            columns: ["geo"]
            isOneToOne: false
            referencedRelation: "geo_data"
            referencedColumns: ["geo"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          subscription_plan: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          subscription_plan?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          subscription_plan?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
