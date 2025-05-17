--
-- PostgreSQL database dump
--

-- Dumped from database version 16.1
-- Dumped by pg_dump version 16.0

-- Started on 2025-05-03 18:23:16 MSK

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 228 (class 1259 OID 16482)
-- Name: admins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admins (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash text NOT NULL,
    format_id integer,
    ppo_id integer,
    created_at timestamp without time zone DEFAULT now(),
    role character varying(50) DEFAULT 'viewer'::character varying
);


ALTER TABLE public.admins OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 16481)
-- Name: admins_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.admins_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admins_id_seq OWNER TO postgres;

--
-- TOC entry 3822 (class 0 OID 0)
-- Dependencies: 227
-- Name: admins_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.admins_id_seq OWNED BY public.admins.id;


--
-- TOC entry 246 (class 1259 OID 16639)
-- Name: attendance_admins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attendance_admins (
    id integer NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    unit_id integer NOT NULL,
    role text DEFAULT 'admin'::text NOT NULL
);


ALTER TABLE public.attendance_admins OWNER TO postgres;

--
-- TOC entry 245 (class 1259 OID 16638)
-- Name: attendance_admins_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.attendance_admins_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.attendance_admins_id_seq OWNER TO postgres;

--
-- TOC entry 3823 (class 0 OID 0)
-- Dependencies: 245
-- Name: attendance_admins_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.attendance_admins_id_seq OWNED BY public.attendance_admins.id;


--
-- TOC entry 232 (class 1259 OID 16522)
-- Name: attendance_groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attendance_groups (
    id integer NOT NULL,
    unit_id integer NOT NULL,
    name text NOT NULL
);


ALTER TABLE public.attendance_groups OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 16521)
-- Name: attendance_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.attendance_groups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.attendance_groups_id_seq OWNER TO postgres;

--
-- TOC entry 3824 (class 0 OID 0)
-- Dependencies: 231
-- Name: attendance_groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.attendance_groups_id_seq OWNED BY public.attendance_groups.id;


--
-- TOC entry 234 (class 1259 OID 16538)
-- Name: attendance_semesters; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attendance_semesters (
    id integer NOT NULL,
    group_id integer NOT NULL,
    name text NOT NULL,
    start_date date,
    end_date date
);


ALTER TABLE public.attendance_semesters OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 16537)
-- Name: attendance_semesters_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.attendance_semesters_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.attendance_semesters_id_seq OWNER TO postgres;

--
-- TOC entry 3825 (class 0 OID 0)
-- Dependencies: 233
-- Name: attendance_semesters_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.attendance_semesters_id_seq OWNED BY public.attendance_semesters.id;


--
-- TOC entry 236 (class 1259 OID 16552)
-- Name: attendance_students; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attendance_students (
    id integer NOT NULL,
    semester_id integer NOT NULL,
    full_name text NOT NULL,
    student_number integer NOT NULL
);


ALTER TABLE public.attendance_students OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 16551)
-- Name: attendance_students_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.attendance_students_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.attendance_students_id_seq OWNER TO postgres;

--
-- TOC entry 3826 (class 0 OID 0)
-- Dependencies: 235
-- Name: attendance_students_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.attendance_students_id_seq OWNED BY public.attendance_students.id;


--
-- TOC entry 230 (class 1259 OID 16506)
-- Name: attendance_units; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attendance_units (
    id integer NOT NULL,
    format_id integer NOT NULL,
    name text NOT NULL
);


ALTER TABLE public.attendance_units OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 16505)
-- Name: attendance_units_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.attendance_units_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.attendance_units_id_seq OWNER TO postgres;

--
-- TOC entry 3827 (class 0 OID 0)
-- Dependencies: 229
-- Name: attendance_units_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.attendance_units_id_seq OWNED BY public.attendance_units.id;


--
-- TOC entry 242 (class 1259 OID 16593)
-- Name: attendances; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attendances (
    id integer NOT NULL,
    lesson_id integer NOT NULL,
    student_id integer NOT NULL,
    status text DEFAULT 'н'::text NOT NULL,
    CONSTRAINT attendances_status_check CHECK ((status = ANY (ARRAY['+'::text, 'н'::text, 'б'::text])))
);


ALTER TABLE public.attendances OWNER TO postgres;

--
-- TOC entry 241 (class 1259 OID 16592)
-- Name: attendances_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.attendances_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.attendances_id_seq OWNER TO postgres;

--
-- TOC entry 3828 (class 0 OID 0)
-- Dependencies: 241
-- Name: attendances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.attendances_id_seq OWNED BY public.attendances.id;


--
-- TOC entry 216 (class 1259 OID 16392)
-- Name: formats; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.formats (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text
);


ALTER TABLE public.formats OWNER TO postgres;

--
-- TOC entry 215 (class 1259 OID 16391)
-- Name: formats_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.formats_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.formats_id_seq OWNER TO postgres;

--
-- TOC entry 3829 (class 0 OID 0)
-- Dependencies: 215
-- Name: formats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.formats_id_seq OWNED BY public.formats.id;


--
-- TOC entry 220 (class 1259 OID 16417)
-- Name: groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.groups (
    id integer NOT NULL,
    ppo_id integer,
    name character varying(255) NOT NULL
);


ALTER TABLE public.groups OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16416)
-- Name: groups_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.groups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.groups_id_seq OWNER TO postgres;

--
-- TOC entry 3830 (class 0 OID 0)
-- Dependencies: 219
-- Name: groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.groups_id_seq OWNED BY public.groups.id;


--
-- TOC entry 240 (class 1259 OID 16581)
-- Name: lessons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lessons (
    id integer NOT NULL,
    subject_id integer NOT NULL,
    lesson_date date NOT NULL
);


ALTER TABLE public.lessons OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 16580)
-- Name: lessons_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.lessons_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lessons_id_seq OWNER TO postgres;

--
-- TOC entry 3831 (class 0 OID 0)
-- Dependencies: 239
-- Name: lessons_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.lessons_id_seq OWNED BY public.lessons.id;


--
-- TOC entry 224 (class 1259 OID 16450)
-- Name: payment_periods; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_periods (
    id integer NOT NULL,
    format_id integer,
    period_name character varying(20) NOT NULL
);


ALTER TABLE public.payment_periods OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16449)
-- Name: payment_periods_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payment_periods_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payment_periods_id_seq OWNER TO postgres;

--
-- TOC entry 3832 (class 0 OID 0)
-- Dependencies: 223
-- Name: payment_periods_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payment_periods_id_seq OWNED BY public.payment_periods.id;


--
-- TOC entry 218 (class 1259 OID 16403)
-- Name: ppo_units; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ppo_units (
    id integer NOT NULL,
    format_id integer,
    name character varying(255) NOT NULL
);


ALTER TABLE public.ppo_units OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 16402)
-- Name: ppo_units_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ppo_units_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ppo_units_id_seq OWNER TO postgres;

--
-- TOC entry 3833 (class 0 OID 0)
-- Dependencies: 217
-- Name: ppo_units_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ppo_units_id_seq OWNED BY public.ppo_units.id;


--
-- TOC entry 244 (class 1259 OID 16614)
-- Name: subject_grades; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subject_grades (
    id integer NOT NULL,
    subject_id integer NOT NULL,
    student_id integer NOT NULL,
    control_1 text,
    control_2 text,
    exam text,
    retake text,
    commission text,
    CONSTRAINT subject_grades_control_1_check CHECK ((control_1 = ANY (ARRAY['0'::text, '1'::text, '2'::text, '3'::text, '4'::text, '5'::text, 'Ня'::text, 'Нд'::text]))),
    CONSTRAINT subject_grades_control_2_check CHECK ((control_2 = ANY (ARRAY['0'::text, '1'::text, '2'::text, '3'::text, '4'::text, '5'::text, 'Ня'::text, 'Нд'::text]))),
    CONSTRAINT subject_grades_exam_check CHECK ((exam = ANY (ARRAY['0'::text, '1'::text, '2'::text, '3'::text, '4'::text, '5'::text, 'Ня'::text, 'Нд'::text, 'Зч'::text]))),
    CONSTRAINT subject_grades_retake_check CHECK ((retake = ANY (ARRAY['0'::text, '1'::text, '2'::text, '3'::text, '4'::text, '5'::text, 'Ня'::text, 'Нд'::text, 'Зч'::text])))
);


ALTER TABLE public.subject_grades OWNER TO postgres;

--
-- TOC entry 243 (class 1259 OID 16613)
-- Name: subject_grades_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.subject_grades_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.subject_grades_id_seq OWNER TO postgres;

--
-- TOC entry 3834 (class 0 OID 0)
-- Dependencies: 243
-- Name: subject_grades_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.subject_grades_id_seq OWNED BY public.subject_grades.id;


--
-- TOC entry 238 (class 1259 OID 16566)
-- Name: subjects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subjects (
    id integer NOT NULL,
    semester_id integer NOT NULL,
    name text NOT NULL
);


ALTER TABLE public.subjects OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 16565)
-- Name: subjects_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.subjects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.subjects_id_seq OWNER TO postgres;

--
-- TOC entry 3835 (class 0 OID 0)
-- Dependencies: 237
-- Name: subjects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.subjects_id_seq OWNED BY public.subjects.id;


--
-- TOC entry 222 (class 1259 OID 16431)
-- Name: union_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.union_members (
    id integer NOT NULL,
    group_id integer,
    full_name character varying(255) NOT NULL,
    birth_date date NOT NULL,
    gender character(1),
    phone character varying(20),
    email character varying(255),
    funding_type character varying(50),
    created_at timestamp without time zone DEFAULT now(),
    year integer,
    status character varying(50) DEFAULT 'состоит'::character varying,
    group_suffix character varying(10),
    CONSTRAINT union_members_funding_type_check CHECK (((funding_type)::text = ANY ((ARRAY['Бюджет'::character varying, 'Платное'::character varying])::text[]))),
    CONSTRAINT union_members_gender_check CHECK ((gender = ANY (ARRAY['м'::bpchar, 'ж'::bpchar])))
);


ALTER TABLE public.union_members OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16430)
-- Name: union_members_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.union_members_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.union_members_id_seq OWNER TO postgres;

--
-- TOC entry 3836 (class 0 OID 0)
-- Dependencies: 221
-- Name: union_members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.union_members_id_seq OWNED BY public.union_members.id;


--
-- TOC entry 226 (class 1259 OID 16464)
-- Name: union_payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.union_payments (
    id integer NOT NULL,
    member_id integer,
    period_id integer,
    paid character varying(2),
    paid_at timestamp without time zone,
    CONSTRAINT union_payments_paid_check CHECK (((paid)::text = ANY ((ARRAY['-'::character varying, '1'::character varying, '0'::character varying])::text[])))
);


ALTER TABLE public.union_payments OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16463)
-- Name: union_payments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.union_payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.union_payments_id_seq OWNER TO postgres;

--
-- TOC entry 3837 (class 0 OID 0)
-- Dependencies: 225
-- Name: union_payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.union_payments_id_seq OWNED BY public.union_payments.id;


--
-- TOC entry 3548 (class 2604 OID 16485)
-- Name: admins id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins ALTER COLUMN id SET DEFAULT nextval('public.admins_id_seq'::regclass);


--
-- TOC entry 3560 (class 2604 OID 16642)
-- Name: attendance_admins id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_admins ALTER COLUMN id SET DEFAULT nextval('public.attendance_admins_id_seq'::regclass);


--
-- TOC entry 3552 (class 2604 OID 16525)
-- Name: attendance_groups id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_groups ALTER COLUMN id SET DEFAULT nextval('public.attendance_groups_id_seq'::regclass);


--
-- TOC entry 3553 (class 2604 OID 16541)
-- Name: attendance_semesters id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_semesters ALTER COLUMN id SET DEFAULT nextval('public.attendance_semesters_id_seq'::regclass);


--
-- TOC entry 3554 (class 2604 OID 16555)
-- Name: attendance_students id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_students ALTER COLUMN id SET DEFAULT nextval('public.attendance_students_id_seq'::regclass);


--
-- TOC entry 3551 (class 2604 OID 16509)
-- Name: attendance_units id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_units ALTER COLUMN id SET DEFAULT nextval('public.attendance_units_id_seq'::regclass);


--
-- TOC entry 3557 (class 2604 OID 16596)
-- Name: attendances id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendances ALTER COLUMN id SET DEFAULT nextval('public.attendances_id_seq'::regclass);


--
-- TOC entry 3540 (class 2604 OID 16395)
-- Name: formats id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.formats ALTER COLUMN id SET DEFAULT nextval('public.formats_id_seq'::regclass);


--
-- TOC entry 3542 (class 2604 OID 16420)
-- Name: groups id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groups ALTER COLUMN id SET DEFAULT nextval('public.groups_id_seq'::regclass);


--
-- TOC entry 3556 (class 2604 OID 16584)
-- Name: lessons id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lessons ALTER COLUMN id SET DEFAULT nextval('public.lessons_id_seq'::regclass);


--
-- TOC entry 3546 (class 2604 OID 16453)
-- Name: payment_periods id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_periods ALTER COLUMN id SET DEFAULT nextval('public.payment_periods_id_seq'::regclass);


--
-- TOC entry 3541 (class 2604 OID 16406)
-- Name: ppo_units id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ppo_units ALTER COLUMN id SET DEFAULT nextval('public.ppo_units_id_seq'::regclass);


--
-- TOC entry 3559 (class 2604 OID 16617)
-- Name: subject_grades id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subject_grades ALTER COLUMN id SET DEFAULT nextval('public.subject_grades_id_seq'::regclass);


--
-- TOC entry 3555 (class 2604 OID 16569)
-- Name: subjects id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subjects ALTER COLUMN id SET DEFAULT nextval('public.subjects_id_seq'::regclass);


--
-- TOC entry 3543 (class 2604 OID 16434)
-- Name: union_members id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.union_members ALTER COLUMN id SET DEFAULT nextval('public.union_members_id_seq'::regclass);


--
-- TOC entry 3547 (class 2604 OID 16467)
-- Name: union_payments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.union_payments ALTER COLUMN id SET DEFAULT nextval('public.union_payments_id_seq'::regclass);


--
-- TOC entry 3798 (class 0 OID 16482)
-- Dependencies: 228
-- Data for Name: admins; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admins (id, name, email, password_hash, format_id, ppo_id, created_at, role) FROM stdin;
2	Anna	profsouz8@mail.ru	$2b$12$wGXbpO7QwgQbVdbI5h4DhutOow3V2bWdYcy8AtiwcB3vRzM8kYpB6	1	8	2025-02-10 18:03:14.16966	admin
\.


--
-- TOC entry 3816 (class 0 OID 16639)
-- Dependencies: 246
-- Data for Name: attendance_admins; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attendance_admins (id, name, email, password_hash, unit_id, role) FROM stdin;
2	Литовченко Анна Александровна	litann@mail.ru	$2b$12$30L4osAWqlUgxI8Dpws5Ee/3C5VbCBM.91RhOfm..l7JzQKB4LtEy	8	admin
\.


--
-- TOC entry 3802 (class 0 OID 16522)
-- Dependencies: 232
-- Data for Name: attendance_groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attendance_groups (id, unit_id, name) FROM stdin;
1	8	М8О-101БВ-24
2	8	М8О-102БВ-24
\.


--
-- TOC entry 3804 (class 0 OID 16538)
-- Dependencies: 234
-- Data for Name: attendance_semesters; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attendance_semesters (id, group_id, name, start_date, end_date) FROM stdin;
1	1	Семестр 1	\N	\N
2	2	Семестр 1	\N	\N
3	1	Семестр 2	\N	\N
\.


--
-- TOC entry 3806 (class 0 OID 16552)
-- Dependencies: 236
-- Data for Name: attendance_students; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attendance_students (id, semester_id, full_name, student_number) FROM stdin;
2	1	Иванов Иван Иванович	1
3	1	Петров Петр Петрович	2
5	1	Яновская Янина Яновна	3
6	1	Сусликов Федор Петрович	4
7	1	Мартынов Феликс Иванович	5
8	3	Иванов Иван Иванович	1
9	3	Петров Петр Петрович	2
10	3	Яновская Янина Яновна	3
11	3	Сусликов Федор Петрович	4
12	3	Мартынов Феликс Иванович	5
\.


--
-- TOC entry 3800 (class 0 OID 16506)
-- Dependencies: 230
-- Data for Name: attendance_units; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attendance_units (id, format_id, name) FROM stdin;
1	2	Институт №1
2	2	Институт №2
3	2	Институт №3
4	2	Институт №4
5	2	Институт №5
6	2	Институт №6
7	2	Институт №7
8	2	Институт №8
9	2	Институт №9
10	2	Институт №10
11	2	Институт №11
12	2	Институт №12
\.


--
-- TOC entry 3812 (class 0 OID 16593)
-- Dependencies: 242
-- Data for Name: attendances; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attendances (id, lesson_id, student_id, status) FROM stdin;
1	2	2	б
2	2	3	н
3	2	5	б
7	2	6	н
9	2	7	н
4	3	2	н
5	3	3	б
6	3	5	н
8	3	6	+
10	3	7	н
11	4	2	н
12	4	3	н
13	4	5	н
14	4	6	н
15	4	7	н
\.


--
-- TOC entry 3786 (class 0 OID 16392)
-- Dependencies: 216
-- Data for Name: formats; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.formats (id, name, description) FROM stdin;
1	Профсоюз	Формат учета для профсоюзной деятельности
2	Академический	Формат учета посещаемости
\.


--
-- TOC entry 3790 (class 0 OID 16417)
-- Dependencies: 220
-- Data for Name: groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.groups (id, ppo_id, name) FROM stdin;
102	8	М8О-102
101	8	М8О-101
201	8	М8О-201
202	8	М8О-202
302	8	М8О-302
402	8	М8О-402
\.


--
-- TOC entry 3810 (class 0 OID 16581)
-- Dependencies: 240
-- Data for Name: lessons; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lessons (id, subject_id, lesson_date) FROM stdin;
2	1	2025-04-24
3	1	2025-04-25
4	1	2025-03-02
\.


--
-- TOC entry 3794 (class 0 OID 16450)
-- Dependencies: 224
-- Data for Name: payment_periods; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payment_periods (id, format_id, period_name) FROM stdin;
2	1	02.24-08.24
\.


--
-- TOC entry 3788 (class 0 OID 16403)
-- Dependencies: 218
-- Data for Name: ppo_units; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ppo_units (id, format_id, name) FROM stdin;
8	1	Институт №8
\.


--
-- TOC entry 3814 (class 0 OID 16614)
-- Dependencies: 244
-- Data for Name: subject_grades; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subject_grades (id, subject_id, student_id, control_1, control_2, exam, retake, commission) FROM stdin;
1	1	2	3	\N	\N	\N	3
2	1	3	\N	\N	\N	\N	\N
3	1	5	5	\N	\N	\N	\N
4	1	6	\N	\N	\N	\N	\N
5	1	7	\N	\N	\N	\N	\N
\.


--
-- TOC entry 3808 (class 0 OID 16566)
-- Dependencies: 238
-- Data for Name: subjects; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subjects (id, semester_id, name) FROM stdin;
1	1	Русский язык
\.


--
-- TOC entry 3792 (class 0 OID 16431)
-- Dependencies: 222
-- Data for Name: union_members; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.union_members (id, group_id, full_name, birth_date, gender, phone, email, funding_type, created_at, year, status, group_suffix) FROM stdin;
6	402	Алексеев Иван Сергеевич	2005-04-16	м	89242393939	ivan_al@mail.ru	Бюджет	2025-04-06 15:11:50.955569	2022	выпущен	21
2	101	Ливанов Иван Иванович	2005-04-01	м	89252344408	ivan09@mail.ru	Бюджет	2025-04-04 00:21:13.760614	2024	отчислен	24
7	402	Филин Сергей Владимирович	2003-01-13	м	89820993432	filin06@mail.ru	Бюджет	2025-04-06 22:08:22.689052	2021	выпущен	21
3	202	Петров Петр Петрович	2006-03-17	м	89242232323	petya11@mail.ru	Бюджет	2025-04-04 17:08:59.214877	2023	состоит	23
5	202	Метров Петр Петрович	2006-03-17	м	89242332323	petya12@mail.ru	Бюджет	2025-04-04 17:38:42.382462	2023	состоит	23
\.


--
-- TOC entry 3796 (class 0 OID 16464)
-- Dependencies: 226
-- Data for Name: union_payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.union_payments (id, member_id, period_id, paid, paid_at) FROM stdin;
3	3	2	-	\N
4	5	2	-	\N
1	6	2	1	2025-04-06 21:59:45.845796
5	7	2	-	2025-04-06 22:08:22.729305
2	2	2	1	2025-05-03 15:09:40.498772
\.


--
-- TOC entry 3838 (class 0 OID 0)
-- Dependencies: 227
-- Name: admins_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.admins_id_seq', 2, true);


--
-- TOC entry 3839 (class 0 OID 0)
-- Dependencies: 245
-- Name: attendance_admins_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.attendance_admins_id_seq', 2, true);


--
-- TOC entry 3840 (class 0 OID 0)
-- Dependencies: 231
-- Name: attendance_groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.attendance_groups_id_seq', 2, true);


--
-- TOC entry 3841 (class 0 OID 0)
-- Dependencies: 233
-- Name: attendance_semesters_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.attendance_semesters_id_seq', 3, true);


--
-- TOC entry 3842 (class 0 OID 0)
-- Dependencies: 235
-- Name: attendance_students_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.attendance_students_id_seq', 12, true);


--
-- TOC entry 3843 (class 0 OID 0)
-- Dependencies: 229
-- Name: attendance_units_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.attendance_units_id_seq', 1, false);


--
-- TOC entry 3844 (class 0 OID 0)
-- Dependencies: 241
-- Name: attendances_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.attendances_id_seq', 15, true);


--
-- TOC entry 3845 (class 0 OID 0)
-- Dependencies: 215
-- Name: formats_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.formats_id_seq', 1, false);


--
-- TOC entry 3846 (class 0 OID 0)
-- Dependencies: 219
-- Name: groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.groups_id_seq', 1, false);


--
-- TOC entry 3847 (class 0 OID 0)
-- Dependencies: 239
-- Name: lessons_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.lessons_id_seq', 4, true);


--
-- TOC entry 3848 (class 0 OID 0)
-- Dependencies: 223
-- Name: payment_periods_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payment_periods_id_seq', 2, true);


--
-- TOC entry 3849 (class 0 OID 0)
-- Dependencies: 217
-- Name: ppo_units_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ppo_units_id_seq', 1, false);


--
-- TOC entry 3850 (class 0 OID 0)
-- Dependencies: 243
-- Name: subject_grades_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.subject_grades_id_seq', 5, true);


--
-- TOC entry 3851 (class 0 OID 0)
-- Dependencies: 237
-- Name: subjects_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.subjects_id_seq', 1, true);


--
-- TOC entry 3852 (class 0 OID 0)
-- Dependencies: 221
-- Name: union_members_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.union_members_id_seq', 7, true);


--
-- TOC entry 3853 (class 0 OID 0)
-- Dependencies: 225
-- Name: union_payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.union_payments_id_seq', 5, true);


--
-- TOC entry 3593 (class 2606 OID 16492)
-- Name: admins admins_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_email_key UNIQUE (email);


--
-- TOC entry 3595 (class 2606 OID 16490)
-- Name: admins admins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (id);


--
-- TOC entry 3620 (class 2606 OID 16649)
-- Name: attendance_admins attendance_admins_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_admins
    ADD CONSTRAINT attendance_admins_email_key UNIQUE (email);


--
-- TOC entry 3622 (class 2606 OID 16647)
-- Name: attendance_admins attendance_admins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_admins
    ADD CONSTRAINT attendance_admins_pkey PRIMARY KEY (id);


--
-- TOC entry 3601 (class 2606 OID 16531)
-- Name: attendance_groups attendance_groups_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_groups
    ADD CONSTRAINT attendance_groups_name_key UNIQUE (name);


--
-- TOC entry 3603 (class 2606 OID 16529)
-- Name: attendance_groups attendance_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_groups
    ADD CONSTRAINT attendance_groups_pkey PRIMARY KEY (id);


--
-- TOC entry 3605 (class 2606 OID 16545)
-- Name: attendance_semesters attendance_semesters_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_semesters
    ADD CONSTRAINT attendance_semesters_pkey PRIMARY KEY (id);


--
-- TOC entry 3607 (class 2606 OID 16559)
-- Name: attendance_students attendance_students_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_students
    ADD CONSTRAINT attendance_students_pkey PRIMARY KEY (id);


--
-- TOC entry 3597 (class 2606 OID 16515)
-- Name: attendance_units attendance_units_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_units
    ADD CONSTRAINT attendance_units_name_key UNIQUE (name);


--
-- TOC entry 3599 (class 2606 OID 16513)
-- Name: attendance_units attendance_units_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_units
    ADD CONSTRAINT attendance_units_pkey PRIMARY KEY (id);


--
-- TOC entry 3614 (class 2606 OID 16602)
-- Name: attendances attendances_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT attendances_pkey PRIMARY KEY (id);


--
-- TOC entry 3571 (class 2606 OID 16401)
-- Name: formats formats_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.formats
    ADD CONSTRAINT formats_name_key UNIQUE (name);


--
-- TOC entry 3573 (class 2606 OID 16399)
-- Name: formats formats_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.formats
    ADD CONSTRAINT formats_pkey PRIMARY KEY (id);


--
-- TOC entry 3579 (class 2606 OID 16424)
-- Name: groups groups_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_name_key UNIQUE (name);


--
-- TOC entry 3581 (class 2606 OID 16422)
-- Name: groups groups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);


--
-- TOC entry 3612 (class 2606 OID 16586)
-- Name: lessons lessons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_pkey PRIMARY KEY (id);


--
-- TOC entry 3587 (class 2606 OID 16457)
-- Name: payment_periods payment_periods_period_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_periods
    ADD CONSTRAINT payment_periods_period_name_key UNIQUE (period_name);


--
-- TOC entry 3589 (class 2606 OID 16455)
-- Name: payment_periods payment_periods_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_periods
    ADD CONSTRAINT payment_periods_pkey PRIMARY KEY (id);


--
-- TOC entry 3575 (class 2606 OID 16410)
-- Name: ppo_units ppo_units_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ppo_units
    ADD CONSTRAINT ppo_units_name_key UNIQUE (name);


--
-- TOC entry 3577 (class 2606 OID 16408)
-- Name: ppo_units ppo_units_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ppo_units
    ADD CONSTRAINT ppo_units_pkey PRIMARY KEY (id);


--
-- TOC entry 3616 (class 2606 OID 16625)
-- Name: subject_grades subject_grades_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subject_grades
    ADD CONSTRAINT subject_grades_pkey PRIMARY KEY (id);


--
-- TOC entry 3618 (class 2606 OID 16627)
-- Name: subject_grades subject_grades_subject_id_student_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subject_grades
    ADD CONSTRAINT subject_grades_subject_id_student_id_key UNIQUE (subject_id, student_id);


--
-- TOC entry 3610 (class 2606 OID 16573)
-- Name: subjects subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_pkey PRIMARY KEY (id);


--
-- TOC entry 3583 (class 2606 OID 16443)
-- Name: union_members union_members_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.union_members
    ADD CONSTRAINT union_members_email_key UNIQUE (email);


--
-- TOC entry 3585 (class 2606 OID 16441)
-- Name: union_members union_members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.union_members
    ADD CONSTRAINT union_members_pkey PRIMARY KEY (id);


--
-- TOC entry 3591 (class 2606 OID 16470)
-- Name: union_payments union_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.union_payments
    ADD CONSTRAINT union_payments_pkey PRIMARY KEY (id);


--
-- TOC entry 3608 (class 1259 OID 16661)
-- Name: uniq_attendance_students_semester_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uniq_attendance_students_semester_number ON public.attendance_students USING btree (semester_id, student_number);


--
-- TOC entry 3629 (class 2606 OID 16493)
-- Name: admins admins_format_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_format_id_fkey FOREIGN KEY (format_id) REFERENCES public.formats(id) ON DELETE CASCADE;


--
-- TOC entry 3630 (class 2606 OID 16498)
-- Name: admins admins_ppo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_ppo_id_fkey FOREIGN KEY (ppo_id) REFERENCES public.ppo_units(id) ON DELETE CASCADE;


--
-- TOC entry 3641 (class 2606 OID 16650)
-- Name: attendance_admins attendance_admins_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_admins
    ADD CONSTRAINT attendance_admins_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.attendance_units(id) ON DELETE CASCADE;


--
-- TOC entry 3632 (class 2606 OID 16532)
-- Name: attendance_groups attendance_groups_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_groups
    ADD CONSTRAINT attendance_groups_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.attendance_units(id) ON DELETE CASCADE;


--
-- TOC entry 3633 (class 2606 OID 16546)
-- Name: attendance_semesters attendance_semesters_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_semesters
    ADD CONSTRAINT attendance_semesters_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.attendance_groups(id) ON DELETE CASCADE;


--
-- TOC entry 3634 (class 2606 OID 16560)
-- Name: attendance_students attendance_students_semester_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_students
    ADD CONSTRAINT attendance_students_semester_id_fkey FOREIGN KEY (semester_id) REFERENCES public.attendance_semesters(id) ON DELETE CASCADE;


--
-- TOC entry 3631 (class 2606 OID 16516)
-- Name: attendance_units attendance_units_format_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_units
    ADD CONSTRAINT attendance_units_format_id_fkey FOREIGN KEY (format_id) REFERENCES public.formats(id) ON DELETE CASCADE;


--
-- TOC entry 3637 (class 2606 OID 16603)
-- Name: attendances attendances_lesson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT attendances_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;


--
-- TOC entry 3638 (class 2606 OID 16608)
-- Name: attendances attendances_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT attendances_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.attendance_students(id) ON DELETE CASCADE;


--
-- TOC entry 3624 (class 2606 OID 16425)
-- Name: groups groups_ppo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_ppo_id_fkey FOREIGN KEY (ppo_id) REFERENCES public.ppo_units(id) ON DELETE CASCADE;


--
-- TOC entry 3636 (class 2606 OID 16587)
-- Name: lessons lessons_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;


--
-- TOC entry 3626 (class 2606 OID 16458)
-- Name: payment_periods payment_periods_format_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_periods
    ADD CONSTRAINT payment_periods_format_id_fkey FOREIGN KEY (format_id) REFERENCES public.formats(id) ON DELETE CASCADE;


--
-- TOC entry 3623 (class 2606 OID 16411)
-- Name: ppo_units ppo_units_format_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ppo_units
    ADD CONSTRAINT ppo_units_format_id_fkey FOREIGN KEY (format_id) REFERENCES public.formats(id) ON DELETE CASCADE;


--
-- TOC entry 3639 (class 2606 OID 16633)
-- Name: subject_grades subject_grades_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subject_grades
    ADD CONSTRAINT subject_grades_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.attendance_students(id) ON DELETE CASCADE;


--
-- TOC entry 3640 (class 2606 OID 16628)
-- Name: subject_grades subject_grades_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subject_grades
    ADD CONSTRAINT subject_grades_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;


--
-- TOC entry 3635 (class 2606 OID 16574)
-- Name: subjects subjects_semester_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_semester_id_fkey FOREIGN KEY (semester_id) REFERENCES public.attendance_semesters(id) ON DELETE CASCADE;


--
-- TOC entry 3625 (class 2606 OID 16444)
-- Name: union_members union_members_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.union_members
    ADD CONSTRAINT union_members_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- TOC entry 3627 (class 2606 OID 16471)
-- Name: union_payments union_payments_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.union_payments
    ADD CONSTRAINT union_payments_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.union_members(id) ON DELETE CASCADE;


--
-- TOC entry 3628 (class 2606 OID 16476)
-- Name: union_payments union_payments_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.union_payments
    ADD CONSTRAINT union_payments_period_id_fkey FOREIGN KEY (period_id) REFERENCES public.payment_periods(id) ON DELETE CASCADE;


-- Completed on 2025-05-03 18:23:17 MSK

--
-- PostgreSQL database dump complete
--

