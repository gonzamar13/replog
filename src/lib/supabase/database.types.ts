// Tipos de la base de datos — el equivalente de "modelos" en este stack:
// no hay clases ORM, la fuente de verdad es el esquema de Postgres
// (supabase/migrations/) y estos tipos son su espejo en TypeScript.
//
// Están escritos a mano para no depender de tener el proyecto de Supabase
// ya linkeado. En cuanto exista el proyecto, se pueden regenerar 1:1 con:
//
//   npx supabase gen types typescript --project-id <ref> > src/lib/supabase/database.types.ts
//
// A partir de ahí, cada migración nueva se refleja acá corriendo ese mismo
// comando de nuevo — este archivo nunca se edita "a ojo" en paralelo al schema.
//
// "Relationships" queda vacío ([]) en todas las tablas: es la metadata que
// usa Supabase para tipar selects con joins embebidos (`.select("*, exercises(*)")`).
// Nada del código actual la usa todavía; `supabase gen types` la completa sola.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          username: string | null;
          unit_pref: "kg" | "lb";
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          username?: string | null;
          unit_pref?: "kg" | "lb";
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          username?: string | null;
          unit_pref?: "kg" | "lb";
          created_at?: string;
        };
        Relationships: [];
      };
      exercises: {
        Row: {
          id: string;
          owner_id: string | null;
          name: string;
          muscle_group: string | null;
          is_custom: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id?: string | null;
          name: string;
          muscle_group?: string | null;
          is_custom?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string | null;
          name?: string;
          muscle_group?: string | null;
          is_custom?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      routine_groups: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          starts_on: string | null;
          ends_on: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          starts_on?: string | null;
          ends_on?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          starts_on?: string | null;
          ends_on?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      routines: {
        Row: {
          id: string;
          owner_id: string;
          gym_id: string | null;
          created_by: string | null;
          group_id: string | null;
          days: number[];
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          gym_id?: string | null;
          created_by?: string | null;
          group_id?: string | null;
          days?: number[];
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          gym_id?: string | null;
          created_by?: string | null;
          group_id?: string | null;
          days?: number[];
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      routine_exercises: {
        Row: {
          id: string;
          routine_id: string;
          exercise_id: string;
          position: number;
          target_sets: number;
          target_reps_min: number | null;
          target_reps_max: number | null;
          target_rest_seconds: number | null;
        };
        Insert: {
          id?: string;
          routine_id: string;
          exercise_id: string;
          position?: number;
          target_sets?: number;
          target_reps_min?: number | null;
          target_reps_max?: number | null;
          target_rest_seconds?: number | null;
        };
        Update: {
          id?: string;
          routine_id?: string;
          exercise_id?: string;
          position?: number;
          target_sets?: number;
          target_reps_min?: number | null;
          target_reps_max?: number | null;
          target_rest_seconds?: number | null;
        };
        Relationships: [];
      };
      workouts: {
        Row: {
          id: string;
          user_id: string;
          routine_id: string | null;
          gym_id: string | null;
          started_at: string;
          ended_at: string | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          routine_id?: string | null;
          gym_id?: string | null;
          started_at?: string;
          ended_at?: string | null;
          notes?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          routine_id?: string | null;
          gym_id?: string | null;
          started_at?: string;
          ended_at?: string | null;
          notes?: string | null;
        };
        Relationships: [];
      };
      workout_exercises: {
        Row: {
          id: string;
          workout_id: string;
          exercise_id: string;
          position: number;
        };
        Insert: {
          id?: string;
          workout_id: string;
          exercise_id: string;
          position?: number;
        };
        Update: {
          id?: string;
          workout_id?: string;
          exercise_id?: string;
          position?: number;
        };
        Relationships: [];
      };
      sets: {
        Row: {
          id: string;
          workout_exercise_id: string;
          set_number: number;
          weight: number | null;
          reps: number | null;
          is_failure: boolean;
          rir: number | null;
          rest_seconds_actual: number | null;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workout_exercise_id: string;
          set_number: number;
          weight?: number | null;
          reps?: number | null;
          is_failure?: boolean;
          rir?: number | null;
          rest_seconds_actual?: number | null;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          workout_exercise_id?: string;
          set_number?: number;
          weight?: number | null;
          reps?: number | null;
          is_failure?: boolean;
          rir?: number | null;
          rest_seconds_actual?: number | null;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      body_weight_logs: {
        Row: {
          id: string;
          user_id: string;
          logged_at: string;
          weight: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          logged_at?: string;
          weight: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          logged_at?: string;
          weight?: number;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
