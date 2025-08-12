

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;




ALTER SCHEMA "public" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";





SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."CreditPurchase" (
    "id" "uuid" NOT NULL,
    "userId" "uuid" NOT NULL,
    "credits" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."CreditPurchase" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Lead" (
    "id" "uuid" NOT NULL,
    "userId" "uuid" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "company" "text",
    "email" "text" NOT NULL,
    "name" "text" NOT NULL
);


ALTER TABLE "public"."Lead" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."PromptRun" (
    "id" "uuid" NOT NULL,
    "userId" "uuid" NOT NULL,
    "leadId" "uuid",
    "templateId" "uuid" NOT NULL,
    "templateKey" "text" NOT NULL,
    "templateVersion" integer NOT NULL,
    "language" "text" NOT NULL,
    "formality" "text" NOT NULL,
    "variables" "jsonb" NOT NULL,
    "finalPrompt" "text" NOT NULL,
    "model" "text" NOT NULL,
    "tokenCount" integer NOT NULL,
    "response" "jsonb" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."PromptRun" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."PromptTemplate" (
    "id" "uuid" NOT NULL,
    "key" "text" NOT NULL,
    "version" integer NOT NULL,
    "label" "text" NOT NULL,
    "body" "text" NOT NULL,
    "isActive" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."PromptTemplate" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."User" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "name" "text",
    "credits" integer DEFAULT 10 NOT NULL
);


ALTER TABLE "public"."User" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."UserProfile" (
    "id" "uuid" NOT NULL,
    "bio" "text",
    "userId" "uuid" NOT NULL
);


ALTER TABLE "public"."UserProfile" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."_prisma_migrations" (
    "id" character varying(36) NOT NULL,
    "checksum" character varying(64) NOT NULL,
    "finished_at" timestamp with time zone,
    "migration_name" character varying(255) NOT NULL,
    "logs" "text",
    "rolled_back_at" timestamp with time zone,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "applied_steps_count" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."_prisma_migrations" OWNER TO "postgres";


ALTER TABLE ONLY "public"."CreditPurchase"
    ADD CONSTRAINT "CreditPurchase_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Lead"
    ADD CONSTRAINT "Lead_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."PromptRun"
    ADD CONSTRAINT "PromptRun_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."PromptTemplate"
    ADD CONSTRAINT "PromptTemplate_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."UserProfile"
    ADD CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."_prisma_migrations"
    ADD CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id");



CREATE INDEX "CreditPurchase_userId_idx" ON "public"."CreditPurchase" USING "btree" ("userId");



CREATE INDEX "PromptRun_templateKey_templateVersion_idx" ON "public"."PromptRun" USING "btree" ("templateKey", "templateVersion");



CREATE INDEX "PromptRun_userId_idx" ON "public"."PromptRun" USING "btree" ("userId");



CREATE INDEX "PromptTemplate_key_isActive_idx" ON "public"."PromptTemplate" USING "btree" ("key", "isActive");



CREATE UNIQUE INDEX "PromptTemplate_key_version_key" ON "public"."PromptTemplate" USING "btree" ("key", "version");



CREATE UNIQUE INDEX "UserProfile_userId_key" ON "public"."UserProfile" USING "btree" ("userId");



CREATE UNIQUE INDEX "User_email_key" ON "public"."User" USING "btree" ("email");



ALTER TABLE ONLY "public"."CreditPurchase"
    ADD CONSTRAINT "CreditPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Lead"
    ADD CONSTRAINT "Lead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."PromptRun"
    ADD CONSTRAINT "PromptRun_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."PromptTemplate"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."PromptRun"
    ADD CONSTRAINT "PromptRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."UserProfile"
    ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON UPDATE CASCADE ON DELETE CASCADE;





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;






































































































































































































RESET ALL;
