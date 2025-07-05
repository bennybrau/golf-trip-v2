--
-- PostgreSQL database dump
--

-- Dumped from database version 15.13 (Homebrew)
-- Dumped by pg_dump version 15.13 (Homebrew)

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

--
-- Data for Name: Golfer; Type: TABLE DATA; Schema: public; Owner: jon.arme
--

INSERT INTO public."Golfer" VALUES ('cmcpa9dz80000swk9kmnst80a', 'Jon Arme', 'jon.arme@gmail.com', '6306703163', '2025-07-04 20:44:46.725', '2025-07-04 20:44:46.725');
INSERT INTO public."Golfer" VALUES ('cmcqgf39r0000swq660syarlx', 'Paul Scaletta', 'paul.scaletta@gmail.com', NULL, '2025-07-05 16:24:56.655', '2025-07-05 16:24:56.655');
INSERT INTO public."Golfer" VALUES ('cmcqgff2n0001swq6yfawkuyr', 'John Scaletta', 'johnscaletta@gmail.com', NULL, '2025-07-05 16:25:11.951', '2025-07-05 16:25:11.951');
INSERT INTO public."Golfer" VALUES ('cmcqgfotu0002swq6kifs1bat', 'Bivens', 'bivens@test.com', NULL, '2025-07-05 16:25:24.594', '2025-07-05 16:25:24.594');


--
-- Data for Name: Foursome; Type: TABLE DATA; Schema: public; Owner: jon.arme
--

INSERT INTO public."Foursome" VALUES ('cmcqggb6h0004swq6m5mvrple', 'FRIDAY_MORNING', 0, '2025-07-05 16:25:53.561', '2025-07-05 19:14:05.584', 'cmcqgfotu0002swq6kifs1bat', 'cmcqgff2n0001swq6yfawkuyr', 'cmcpa9dz80000swk9kmnst80a', 'cmcqgf39r0000swq660syarlx', '2025-09-27 09:00:00', 'BLACK');


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: jon.arme
--

INSERT INTO public."User" VALUES ('cmchrt1e30000sw580yxxe4ua', 'jon.arme@gmail.com', 'jon.arme', 'https://gravatar.com/avatar/c6c86cde36e4b1bafb69cacb27521c44?size=256', '6306703163', '$2b$10$zHITMHsCIwHc/LcczqxWYO4.J8LNeKMUHaRMKuVJN5wUqiE1yGeju', '2025-06-29 14:33:47.596', '2025-07-05 18:39:17.109', true);
INSERT INTO public."User" VALUES ('cmcqlzrve0000swhy6sfyx91t', 'johnscaletta@gmail.com', 'John Scaletta', NULL, NULL, '$2b$10$4AnulcRs2d3e0WvAvL7F6.TN0XXrehIzmGfKfyXRfdHFx5bKPY3w2', '2025-07-05 19:00:59.739', '2025-07-05 19:00:59.739', false);


--
-- Data for Name: Photo; Type: TABLE DATA; Schema: public; Owner: jon.arme
--

INSERT INTO public."Photo" VALUES ('cmcqpvg100001swgdrqg5hyjp', '7c480899-b325-4368-defd-0d9753f0f400', 'https://imagedelivery.net/ZwYyTmfX0DLOTV-HuRuKrw/7c480899-b325-4368-defd-0d9753f0f400/public', 'Imported from Cloudflare: IMG_0474.jpeg', 'Imported', 'cmchrt1e30000sw580yxxe4ua', '2025-07-05 20:49:36.228', '2025-07-05 20:49:36.228');
INSERT INTO public."Photo" VALUES ('cmcqpvg130003swgdfdyagnz3', 'a6f3437e-d63e-43c5-9ff9-e3b435667b00', 'https://imagedelivery.net/ZwYyTmfX0DLOTV-HuRuKrw/a6f3437e-d63e-43c5-9ff9-e3b435667b00/public', 'Imported from Cloudflare: IMG_0473.jpeg', 'Imported', 'cmchrt1e30000sw580yxxe4ua', '2025-07-05 20:49:36.231', '2025-07-05 20:49:36.231');
INSERT INTO public."Photo" VALUES ('cmcqpvg140005swgdp84efvnq', 'c4a20ac7-c1e4-433c-c74c-53cef4c11200', 'https://imagedelivery.net/ZwYyTmfX0DLOTV-HuRuKrw/c4a20ac7-c1e4-433c-c74c-53cef4c11200/public', 'Imported from Cloudflare: IMG_6518.jpg', 'Imported', 'cmchrt1e30000sw580yxxe4ua', '2025-07-05 20:49:36.232', '2025-07-05 20:49:36.232');
INSERT INTO public."Photo" VALUES ('cmcqpvg150007swgdyt7z701g', 'bd77d893-0675-4125-2c07-ccb3c6fa0e00', 'https://imagedelivery.net/ZwYyTmfX0DLOTV-HuRuKrw/bd77d893-0675-4125-2c07-ccb3c6fa0e00/public', 'Imported from Cloudflare: quigs-2023.jpeg', 'Imported', 'cmchrt1e30000sw580yxxe4ua', '2025-07-05 20:49:36.233', '2025-07-05 20:49:36.233');
INSERT INTO public."Photo" VALUES ('cmcqpvg160009swgd9zb3hb9o', 'b0e19ab9-5bf0-49f4-109a-f5fec804bf00', 'https://imagedelivery.net/ZwYyTmfX0DLOTV-HuRuKrw/b0e19ab9-5bf0-49f4-109a-f5fec804bf00/public', 'Imported from Cloudflare: coach-brad-2022.jpeg', 'Imported', 'cmchrt1e30000sw580yxxe4ua', '2025-07-05 20:49:36.234', '2025-07-05 20:49:36.234');
INSERT INTO public."Photo" VALUES ('cmcqpvg17000bswgdcgedkt9i', 'b07ad9cf-ef48-4664-e2ce-c40b8b61f300', 'https://imagedelivery.net/ZwYyTmfX0DLOTV-HuRuKrw/b07ad9cf-ef48-4664-e2ce-c40b8b61f300/public', 'Imported from Cloudflare: ryan-f-2021.jpeg', 'Imported', 'cmchrt1e30000sw580yxxe4ua', '2025-07-05 20:49:36.235', '2025-07-05 20:49:36.235');
INSERT INTO public."Photo" VALUES ('cmcqpvg18000dswgdrfkmuxg9', '3355435e-cd0f-4a4d-40e7-c70bedd65600', 'https://imagedelivery.net/ZwYyTmfX0DLOTV-HuRuKrw/3355435e-cd0f-4a4d-40e7-c70bedd65600/public', 'Imported from Cloudflare: operator-2020.jpeg', 'Imported', 'cmchrt1e30000sw580yxxe4ua', '2025-07-05 20:49:36.236', '2025-07-05 20:49:36.236');
INSERT INTO public."Photo" VALUES ('cmcqpvg19000fswgdmgzzc1yd', '7266018d-3ebc-44ff-752e-31891e653f00', 'https://imagedelivery.net/ZwYyTmfX0DLOTV-HuRuKrw/7266018d-3ebc-44ff-752e-31891e653f00/public', 'Imported from Cloudflare: IMG_3235.jpeg', 'Imported', 'cmchrt1e30000sw580yxxe4ua', '2025-07-05 20:49:36.238', '2025-07-05 20:49:36.238');
INSERT INTO public."Photo" VALUES ('cmcqpvg1b000hswgdre8a90er', 'cb7c76fc-5d9a-42df-948d-249836b6c900', 'https://imagedelivery.net/ZwYyTmfX0DLOTV-HuRuKrw/cb7c76fc-5d9a-42df-948d-249836b6c900/public', 'Imported from Cloudflare: Image_000417.jpeg', 'Imported', 'cmchrt1e30000sw580yxxe4ua', '2025-07-05 20:49:36.239', '2025-07-05 20:49:36.239');
INSERT INTO public."Photo" VALUES ('cmcqpvg1b000jswgdwclq3onu', '14e1404f-8e24-439b-93a3-ea0fac201300', 'https://imagedelivery.net/ZwYyTmfX0DLOTV-HuRuKrw/14e1404f-8e24-439b-93a3-ea0fac201300/public', 'Imported from Cloudflare: IMG_3222.jpeg', 'Imported', 'cmchrt1e30000sw580yxxe4ua', '2025-07-05 20:49:36.24', '2025-07-05 20:49:36.24');
INSERT INTO public."Photo" VALUES ('cmcqpvg1c000lswgdbbq7xte3', 'b79ef797-a550-4ca7-9ad4-a08859b00200', 'https://imagedelivery.net/ZwYyTmfX0DLOTV-HuRuKrw/b79ef797-a550-4ca7-9ad4-a08859b00200/public', 'Imported from Cloudflare: IMG_6531.jpeg', 'Imported', 'cmchrt1e30000sw580yxxe4ua', '2025-07-05 20:49:36.241', '2025-07-05 20:49:36.241');
INSERT INTO public."Photo" VALUES ('cmcqpvg1d000nswgdi86jb0x4', '3df21778-a2c8-4abf-dc52-ca56850f1a00', 'https://imagedelivery.net/ZwYyTmfX0DLOTV-HuRuKrw/3df21778-a2c8-4abf-dc52-ca56850f1a00/public', 'Imported from Cloudflare: IMG_7944.jpg', 'Imported', 'cmchrt1e30000sw580yxxe4ua', '2025-07-05 20:49:36.241', '2025-07-05 20:49:36.241');
INSERT INTO public."Photo" VALUES ('cmcqpvg1e000pswgda0qcveyt', '642e72f1-fd72-4441-e3c5-507b162aa600', 'https://imagedelivery.net/ZwYyTmfX0DLOTV-HuRuKrw/642e72f1-fd72-4441-e3c5-507b162aa600/public', 'Imported from Cloudflare: IMG_1977.JPG', 'Imported', 'cmchrt1e30000sw580yxxe4ua', '2025-07-05 20:49:36.242', '2025-07-05 20:49:36.242');
INSERT INTO public."Photo" VALUES ('cmcqpvg1e000rswgdd8sagopx', 'fbb0fa30-f20b-48e2-9427-bb807bba8b00', 'https://imagedelivery.net/ZwYyTmfX0DLOTV-HuRuKrw/fbb0fa30-f20b-48e2-9427-bb807bba8b00/public', 'Imported from Cloudflare: bivens.png', 'Imported', 'cmchrt1e30000sw580yxxe4ua', '2025-07-05 20:49:36.243', '2025-07-05 20:49:36.243');
INSERT INTO public."Photo" VALUES ('cmcqpvg1f000tswgdrkd4ew11', '9e88f9c6-102d-48c0-0662-9eb4788f4400', 'https://imagedelivery.net/ZwYyTmfX0DLOTV-HuRuKrw/9e88f9c6-102d-48c0-0662-9eb4788f4400/public', 'Imported from Cloudflare: 68573733585__96E8947D-6BA8-4FC4-9B65-A7730C51032F.jpg', 'Imported', 'cmchrt1e30000sw580yxxe4ua', '2025-07-05 20:49:36.243', '2025-07-05 20:49:36.243');
INSERT INTO public."Photo" VALUES ('cmcqpvg1g000vswgd4b2tolgq', '23b084d0-119a-4b61-b333-1a575ffd7600', 'https://imagedelivery.net/ZwYyTmfX0DLOTV-HuRuKrw/23b084d0-119a-4b61-b333-1a575ffd7600/public', 'Imported from Cloudflare: IMG_7947.jpg', 'Imported', 'cmchrt1e30000sw580yxxe4ua', '2025-07-05 20:49:36.244', '2025-07-05 20:49:36.244');
INSERT INTO public."Photo" VALUES ('cmcqpvg1g000xswgdq9vyh9lk', '1bea9318-de19-403a-7afa-7b35e15b7800', 'https://imagedelivery.net/ZwYyTmfX0DLOTV-HuRuKrw/1bea9318-de19-403a-7afa-7b35e15b7800/public', 'Imported from Cloudflare: IMG_1798.jpg', 'Imported', 'cmchrt1e30000sw580yxxe4ua', '2025-07-05 20:49:36.245', '2025-07-05 20:49:36.245');
INSERT INTO public."Photo" VALUES ('cmcqpvg1h000zswgdx0bvg4sp', '0e76dd68-007a-44a4-5d29-6c7c5cad9900', 'https://imagedelivery.net/ZwYyTmfX0DLOTV-HuRuKrw/0e76dd68-007a-44a4-5d29-6c7c5cad9900/public', 'Imported from Cloudflare: IMG_1571.jpg', 'Imported', 'cmchrt1e30000sw580yxxe4ua', '2025-07-05 20:49:36.245', '2025-07-05 20:49:36.245');
INSERT INTO public."Photo" VALUES ('cmcqpvg1i0011swgd5srj732n', '0a9e7bfe-f7ec-4b68-003f-e6032aabe700', 'https://imagedelivery.net/ZwYyTmfX0DLOTV-HuRuKrw/0a9e7bfe-f7ec-4b68-003f-e6032aabe700/public', 'Imported from Cloudflare: IMG_3840.jpg', 'Imported', 'cmchrt1e30000sw580yxxe4ua', '2025-07-05 20:49:36.246', '2025-07-05 20:49:36.246');
INSERT INTO public."Photo" VALUES ('cmcqpvg1i0013swgdbzuwjjpg', '7ca1244d-4b4d-487c-332f-a9835629d500', 'https://imagedelivery.net/ZwYyTmfX0DLOTV-HuRuKrw/7ca1244d-4b4d-487c-332f-a9835629d500/public', 'Imported from Cloudflare: IMG_1806.jpg', 'Imported', 'cmchrt1e30000sw580yxxe4ua', '2025-07-05 20:49:36.247', '2025-07-05 20:49:36.247');
INSERT INTO public."Photo" VALUES ('cmcqpvg1j0015swgdo0zmf14h', 'a8d7a8a1-cf3e-4b91-020d-6baf66603200', 'https://imagedelivery.net/ZwYyTmfX0DLOTV-HuRuKrw/a8d7a8a1-cf3e-4b91-020d-6baf66603200/public', 'Imported from Cloudflare: IMG_1784.jpg', 'Imported', 'cmchrt1e30000sw580yxxe4ua', '2025-07-05 20:49:36.247', '2025-07-05 20:49:36.247');
INSERT INTO public."Photo" VALUES ('cmcqpvg1j0017swgdpvu15r6t', '5f3c56bc-15a1-40b9-ec4f-cb1be5891600', 'https://imagedelivery.net/ZwYyTmfX0DLOTV-HuRuKrw/5f3c56bc-15a1-40b9-ec4f-cb1be5891600/public', 'Imported from Cloudflare: IMG_0824.jpg', 'Imported', 'cmchrt1e30000sw580yxxe4ua', '2025-07-05 20:49:36.248', '2025-07-05 20:49:36.248');
INSERT INTO public."Photo" VALUES ('cmcqpvg1k0019swgd18x6pols', '3e841f80-6b2e-4f7a-d346-28416dae2e00', 'https://imagedelivery.net/ZwYyTmfX0DLOTV-HuRuKrw/3e841f80-6b2e-4f7a-d346-28416dae2e00/public', 'Imported from Cloudflare: IMG_1796.jpg', 'Imported', 'cmchrt1e30000sw580yxxe4ua', '2025-07-05 20:49:36.248', '2025-07-05 20:49:36.248');
INSERT INTO public."Photo" VALUES ('cmcqpvg1k001bswgdaixz59ke', 'aa17a3f6-753f-4d21-224b-c5c8b5da0400', 'https://imagedelivery.net/ZwYyTmfX0DLOTV-HuRuKrw/aa17a3f6-753f-4d21-224b-c5c8b5da0400/public', 'Imported from Cloudflare: IMG_3868.jpg', 'Imported', 'cmchrt1e30000sw580yxxe4ua', '2025-07-05 20:49:36.249', '2025-07-05 20:49:36.249');
INSERT INTO public."Photo" VALUES ('cmcqpvg1m001fswgdhcn0jbyo', '4c97a770-8ea6-47bc-d664-f9170905a400', 'https://imagedelivery.net/ZwYyTmfX0DLOTV-HuRuKrw/4c97a770-8ea6-47bc-d664-f9170905a400/public', 'Imported from Cloudflare: IMG_0096.jpg', 'Imported', 'cmchrt1e30000sw580yxxe4ua', '2025-07-05 20:49:36.25', '2025-07-05 20:49:36.25');
INSERT INTO public."Photo" VALUES ('cmcqpvg1l001dswgd6opkv0iq', '30ceaa53-69e6-46c8-48e6-a3eb9cd84500', 'https://imagedelivery.net/ZwYyTmfX0DLOTV-HuRuKrw/30ceaa53-69e6-46c8-48e6-a3eb9cd84500/public', 'test', NULL, 'cmchrt1e30000sw580yxxe4ua', '2025-07-05 20:49:36.25', '2025-07-05 21:01:56.061');


--
-- Data for Name: Session; Type: TABLE DATA; Schema: public; Owner: jon.arme
--

INSERT INTO public."Session" VALUES ('cmcql86sb0001sw7f16v58adl', '042d37a7-55f2-466a-ae47-588ec0c7a715', 'cmchrt1e30000sw580yxxe4ua', '2025-08-04 18:39:32.699', '2025-07-05 18:39:32.7');
INSERT INTO public."Session" VALUES ('cmcqmekp70004swhyhq441nd2', '0635dee0-c602-4442-9196-5c8682bd6a9c', 'cmchrt1e30000sw580yxxe4ua', '2025-08-04 19:12:30.283', '2025-07-05 19:12:30.283');


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: jon.arme
--

INSERT INTO public._prisma_migrations VALUES ('0d69decb-20ff-42d8-b814-3088cfa8a955', '1f9e69aca8af82ebc7a5f6e434952df51d1da4c9eb9e8c2245a4d7c12e868022', '2025-06-29 09:30:52.126325-05', '20250629143052_init_postgresql', NULL, NULL, '2025-06-29 09:30:52.123017-05', 1);
INSERT INTO public._prisma_migrations VALUES ('21e3828b-29c3-4b64-ab7e-8dadb11d5d2b', '79430f84e6733e2863af55b598c427d29f5ecbfdeee5077df463fd3b7d3cfe45', '2025-07-04 15:40:06.428257-05', '20250704204006_golfer', NULL, NULL, '2025-07-04 15:40:06.414923-05', 1);
INSERT INTO public._prisma_migrations VALUES ('f5bdc11f-a7c4-4a39-918f-0fa040cc2e5e', '093510dec5dbaf9bc52a18f307d980b1a7c0ace2c9d8f7596088251eb7bdd5ef', '2025-07-05 11:13:59.659298-05', '20250705161359_add_foursome_model', NULL, NULL, '2025-07-05 11:13:59.655198-05', 1);
INSERT INTO public._prisma_migrations VALUES ('cfec0618-c243-4809-8266-ec62c9acd735', 'cb7666f74c5f988ba2425052aaf8c1bc7f668e5b10c0fba1cd3fabf7e0ca4b11', '2025-07-05 11:23:52.911071-05', '20250705162352_make_foursome_players_optional', NULL, NULL, '2025-07-05 11:23:52.90847-05', 1);
INSERT INTO public._prisma_migrations VALUES ('bc4ec22c-6ff1-49d6-9894-68686456d2d0', '092babb9d4a1af1df137584e78eeacd0c8d143786875e7663338ea56130ba23f', '2025-07-05 11:47:49.466002-05', '20250705164749_add_tee_time', NULL, NULL, '2025-07-05 11:47:49.465053-05', 1);
INSERT INTO public._prisma_migrations VALUES ('4a447556-29cb-4553-8214-f5e95b2368a7', 'f9a955e1d8c9414dc3a74b86e8da78e0d8664a44634bed6082dcb85377bf7db6', '2025-07-05 11:58:39.942482-05', '20250705165839_add_course_field', NULL, NULL, '2025-07-05 11:58:39.941165-05', 1);
INSERT INTO public._prisma_migrations VALUES ('23c3b1b6-1007-4419-84bd-abcf699b3728', '455896faab348e78b48d5151f70233c1853297fc1a4ad9db9017becb9b5bac5b', '2025-07-05 12:00:24.963513-05', '20250705170000_make_course_teetime_required_score_default_zero', NULL, NULL, '2025-07-05 12:00:24.961978-05', 1);
INSERT INTO public._prisma_migrations VALUES ('df064309-39c0-4018-8575-4afa1f31dad0', '8653293e9f65485c3878d9700d9343cb11f0c6dd7644675bb71c19040ca09a8d', '2025-07-05 13:35:51.313595-05', '20250705183551_add_user_admin_field', NULL, NULL, '2025-07-05 13:35:51.312296-05', 1);
INSERT INTO public._prisma_migrations VALUES ('cb674794-b992-4642-87cd-a3a21427cbfe', 'd4be4f22aa8dc875afa890865f015bb944728d82a28dddc27850bc45ad7b3020', '2025-07-05 15:10:06.573303-05', '20250705201006_add_photo_model', NULL, NULL, '2025-07-05 15:10:06.569285-05', 1);


--
-- PostgreSQL database dump complete
--

