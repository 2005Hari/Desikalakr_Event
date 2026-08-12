import React, { useState, useEffect, useMemo, useRef, useContext, createContext } from "react";
import {
  Home, Users, Ticket, Palette, Wallet, AlertTriangle, BarChart3, Settings as SettingsIcon,
  Search, CheckCircle2, XCircle, Clock, Phone, Mail, GraduationCap, Package, ChevronRight,
  Download, RefreshCw, X, AlertCircle, TrendingUp, PieChart as PieChartIcon, Loader2,
  ShieldCheck, ShieldAlert, ShieldQuestion, ArrowLeft, Sparkles, UserPlus, Plus
} from "lucide-react";

// Raw registration data extracted from Desi Kalakar Registrations (Responses).xlsx
// Format per row: [id, timestamp, email, numParticipants, kitRaw, kitType, price, paymentProofLink, participants]
// participants: [name, phone, year, school, programme][]
const RAW_DATA = [["R001","2026-08-06T00:27:14.477","sharmaarchi915@gmail.com",2,"Mirror Painting [Rs.119], Canvas and Stand [Rs.99], Combo [Rs.119]","Multiple-Flagged",null,"https://drive.google.com/open?id=1OpVQoWtceLHaVZKuxXCM62WczaYVlCfC",[["Me","8305210233",4.0,"MPSTME","MBA Tech"],["Mera akelapan","649767636764494",4.0,"MPSTME","B.Tech"]]],["R002","2026-08-06T01:22:29.276","aarav.tripathi2006@gmail.com",2,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=1PPxctLKCmrV1x-JKNquYlK68p2pW0nkC",[["Aarav Tripathi","9870015949",2.0,"MPSTME","MBA Tech"],["Anushka Gupta","9399968315",2.0,"MPSTME","MBA Tech"]]],["R003","2026-08-06T01:28:44.336","siddharthpurohit1807@gmail.com",2,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=1XY-dZBd17kPtNGza4hYRaCZle4dEG1pa",[["Siddharth Purohit","8104062646",2.0,"MPSTME","MBA Tech"],["Prabhas Patidar","8949963146",2.0,"MPSTME","MBA Tech"]]],["R004","2026-08-06T01:32:30.998","rudrakshladdha09@gmail.com",1,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=1M8p1z6rsY8l8I7A1YAv5ZlC8fwNLDfz7",[["Rudraksh","7426815935",2.0,"MPSTME","MBA Tech"]]],["R005","2026-08-06T01:39:37.658","rutuvekariya136@gmail.com",1,"Mirror Painting [Rs.119]","Mirror",119,"https://drive.google.com/open?id=1qEmgitBSuVsmRAf8A1YjnOsVMUdrJ0J0",[["Rutu Vekariya","7359046938",4.0,"MPSTME","B.Tech"]]],["R006","2026-08-06T10:19:26.081","shikhar.baluapuri@gmail.com",2,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=1__xwqPH-n23545pjN8FnVExG468UPr7i",[["Shikhar Baluapuri","8623876930",3.0,"MPSTME","MBA Tech"],["Pranshi Amrodiya","9075200899",3.0,"MPSTME","MBA Tech"]]],["R007","2026-08-06T10:29:58.303","kavyanshnimawat007@gmail.com",2,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=1tC8Qx2u0nTfqrs5KTy9KfaCLMKNwdsbW",[["Kavyansh Nimawat","9352282120",3.0,"MPSTME","MBA Tech"],["Stuti Malviya","9630964264",3.0,"MPSTME","B.Tech"]]],["R008","2026-08-06T10:54:53.540","njnaman19d@gmail.com",2,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=1uEqISVMieAE9fiqH1l9mZXn2SO0JCJ1G",[["Naman","7979801629",3.0,"MPSTME","MBA Tech"],["Palak","9521238862",1.0,"MPSTME","MBA Tech"]]],["R009","2026-08-06T11:11:46.662","vanshika112007@gmail.com",2,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=1GEGAItx-8atgpH6_1opTASJ3UUKQJpNi",[["Vanshika singh","7821951399",2.0,"MPSTME","MBA Tech"],["Soham shinkar","9272053794",2.0,"MPSTME","B.Tech"]]],["R010","2026-08-06T11:13:38.871","aashiprachi029@gmail.com",1,"Mirror Painting [Rs.119]","Mirror",119,"https://drive.google.com/open?id=1lgMZ-mLVsTYxjnQRIuKzr1sURdficFvk",[["Aashi Verma","9315257239",3.0,"MPSTME","MBA Tech"]]],["R011","2026-08-06T11:45:07.098","ananyam271004@gmail.com",2,"Mirror Painting [Rs.119]","Mirror",119,"https://drive.google.com/open?id=1ghW10ScO-fNfPsNLRVqm5cRG9cZ9evlh",[["Ananya Mishra","6264587772",3.0,"MPSTME","MBA Tech"],["Parth Mahajan","9825591590",3.0,"MPSTME","B.Tech"]]],["R012","2026-08-06T11:47:31.341","kgagrawal2006@gmail.com",2,"Mirror Painting [Rs.119]","Mirror",119,"https://drive.google.com/open?id=1WiR3StLw8ah0sxs8AfmorKMUhWUrG04F",[["Khushi Agrawal","9307738120",3.0,"MPSTME","MBA Tech"],["Vishnu Panicker","9769268125",3.0,"MPSTME","MBA Tech"]]],["R013","2026-08-06T12:07:21.756","ananyasinha54321@gmail.com",2,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=1nc6VhoS8FGgJGbMe0Gjgo709-mmGAmhZ",[["Ananya sinha","9545761666",2.0,"MPSTME","B.Tech"],["Tanishka Bhoir","9987207943",2.0,"MPSTME","B.Tech"]]],["R014","2026-08-06T12:07:24.124","parvabagadiarock@gmail.com",2,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=1pUzD2TgQXflswwX6eQwemlAXg4xgwi1n",[["Parva","9499808333",3.0,"MPSTME","B.Tech"],["Nishtha","9399236477",3.0,"MPSTME","B.Tech"]]],["R015","2026-08-06T12:32:09","shreypandey2006@gmail.com",2,"Mirror Painting [Rs.119]","Mirror",119,"https://drive.google.com/open?id=1GSnZ6kL5tOt1AzL-Rr3k_cT77N2OgbRN",[["Shreya","9142037662",2.0,"MPSTME","MBA Tech"],["Parnika","9284065094",2.0,"MPSTME","B.Tech"]]],["R016","2026-08-06T12:34:13.101","bhumikachavan588@gmail.com",1,"Mirror Painting [Rs.119]","Mirror",119,"https://drive.google.com/open?id=1PActlxnjA07-IXuXOoAE6svX2Ee2RG65",[["Bhumika Madhukar Chavan","7588552467",3.0,"MPSTME","B.Tech"]]],["R017","2026-08-06T12:34:52.569","sakshinahar2006@gmail.com",1,"Mirror Painting [Rs.119]","Mirror",119,"https://drive.google.com/open?id=1eRaVjBCiOuNQqYeyipzsifbw2hF1VWeJ",[["Sakshi Nahar","9649414885",2.0,"MPSTME","B.Tech"]]],["R018","2026-08-06T12:35:01.433","chinmaya.chamedia@gmail.com",1,"Mirror Painting [Rs.119]","Mirror",119,"https://drive.google.com/open?id=1zNaSpqnEW8yIN17UH5tUYA5sj_6S2oQx",[["Chinmaya Chamedia","9307309039",3.0,"MPSTME","B.Tech"]]],["R019","2026-08-06T12:37:27.794","mansijaroli26@gmail.com",1,"Mirror Painting [Rs.119]","Mirror",119,"https://drive.google.com/open?id=1bqz-dX4Q3LwJN1zr45ZJB9E2Tx4OLxC7",[["Mansi Jaroli","8302488031",3.0,"MPSTME","MBA Tech"]]],["R020","2026-08-06T12:38:44.013","shreypandey2006@gmail.com",1,"Mirror Painting [Rs.119]","Mirror",119,"https://drive.google.com/open?id=16zd_ucB3GkJYyUCpx9oT15rUCF7pdQoP",[["Shreya Pandey","9142037662",2.0,"MPSTME","MBA Tech"]]],["R021","2026-08-06T13:16:02.396","irahait01@gmail.com",1,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=1lm8-S7v4fFRjnrf49PqqeNqxbyt2jaAd",[["Ira","9881007455",1.0,"MPSTME","MBA Tech"]]],["R022","2026-08-06T13:17:14.684","nandwanashaily110@gmail.com",1,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=1s1OBjy7fnr0gz6cEH83ubypMWeZYPQwA",[["Shaily Nandwana","8306330841",1.0,"MPSTME","MBA Tech"]]],["R023","2026-08-06T13:36:03.987","dikshakuwar23@gmail.com",1,"Mirror Painting [Rs.119]","Mirror",119,"https://drive.google.com/open?id=1kN2m5qUlyIYfv3BzsZ7K666cfJzJY7Ne",[["Diksha Kuwar","9028686450",3.0,"MPSTME","B.Tech"]]],["R024","2026-08-06T13:40:52.519","ansarilucky428@gmail.com",2,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=1T2sxWmDxROtPmBi8g1lrVxOl1uO2Skqh",[["Lucky","8175090288",3.0,"MPSTME","B.Tech"],["Amishka","8949588788",3.0,"MPSTME","B.Tech"]]],["R025","2026-08-06T14:15:20.865","shrutimishra.ind07@gmail.com",2,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=1CJmHNGxNz98zwCyUDJR73_U2yryXh3B7",[["Shruti Mishra","7999739591",4.0,"MPSTME","B.Tech"],["Vishal bhalaji","8810450653",2.0,"MPSTME","B.Tech"]]],["R026","2026-08-06T14:21:58.890","akarti159@gmail.com",2,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=1ufo3wQBJDhZ9b2P26FzgNd95gkGRD_H9",[["Akarti Tyagi","7203095201",2.0,"MPSTME","B.Tech"],["Vaibhav Raghuvanshi","8319610481",3.0,"MPSTME","B.Tech"]]],["R027","2026-08-06T15:09:19.492","rushabhmunot2007@gmail.com",2,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=1aISiNh91S6ka7M0TcVfK0tGQRg-mouee",[["Rushabh","8010505723",3.0,"MPSTME","MBA Tech"],["Aagam","6353221783",3.0,"MPSTME","MBA Tech"]]],["R028","2026-08-06T15:53:30.025","ghatiyanishtha2102@gmail.com",2,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=1ulEsD8HJu_HoBUBIfRMqCwkTev4H6Frl",[["atharva khandelwal","8989925173",3.0,"MPSTME","B.Tech"],["Preet badera","8319380600",3.0,"MPSTME","B.Tech"]]],["R029","2026-08-06T16:21:21.618","vishakhaj009@gmail.com",2,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=1W2xZrRTj383SGxyaxK01W8IXRQUwOabU",[["Vishakha Jadhav","9284234207",3.0,"MPSTME","B.Tech"],["Sakshi holankar","7676333936",3.0,"MPSTME","B.Tech"]]],["R030","2026-08-06T16:47:13.330","shreyaddesai11@gmail.com",2,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=1z2dEABtMXtAqFT2L-j6dRLyJiF3NKaYs",[["Shreya Desai","9726929006",3.0,"MPSTME","B.Tech"],["Keshav Yadav","7089658396",3.0,"MPSTME","B.Tech"]]],["R031","2026-08-06T17:03:25.066","krishadesai1609@gmail.com",2,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=1Z7Qc_H9KY0v11JanXY58gVCfB7nmqF8J",[["Krisha Desai","8980711727",3.0,"MPSTME","MBA Tech"],["Laksh Methi","9358821133",3.0,"MPSTME","MBA Tech"]]],["R032","2026-08-06T18:18:07.105","krishnarajpurohit2711@gmail.com",2,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=1G41dc_aQ4U0ihhM_5biqSW3PBDRSVvn8",[["Krishna","7359881008",2.0,"MPSTME","B.Tech"],["Shourya","9816008923",2.0,"MPSTME","B.Tech"]]],["R033","2026-08-06T18:52:47.722","aaryadesale2310@gmail.com",2,"Mirror Painting [Rs.119]","Mirror",119,"https://drive.google.com/open?id=1I_dKCcwWnaQQgdB6mznA3gXT1QqfSlaL",[["Aarya Desale","7620959169",2.0,"MPSTME","B.Tech"],["Jayam Jain","9881557357",2.0,"SPTM","B.Pharm"]]],["R034","2026-08-06T19:23:54.695","chahatsaraf01@gmail.com",2,"Mirror Painting [Rs.119]","Mirror",119,"https://drive.google.com/open?id=1-xE6BMDxoFTAvEYVCQT5g2Q1bRk3B43r",[["Chahat Saraf","6269945045",2.0,"MPSTME","B.Tech"],["Kashvi Khandelwal","6350310040",2.0,"MPSTME","B.Tech"]]],["R035","2026-08-06T19:26:24.538","stutidave780@gmail.com",2,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=1GKPLyBB1xbq9XfNau8B5Q2EmJmaTBmdd",[["Stuti Dave","7587574790",2.0,"MPSTME","B.Tech"],["Anshul Potdar","9209694278",3.0,"MPSTME","B.Tech"]]],["R036","2026-08-06T20:00:55.006","jainpahal1505@gmail.com",2,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=19y4ZfAAbrYyDrRSO2GhKyFQu5wacTyZA",[["Pahal jain","8955342132",1.0,"MPSTME","B.Tech"],["Kinshu jain","805806960",3.0,"MPSTME","B.Tech"]]],["R037","2026-08-06T21:21:22.407","anvi.gautam.ai@gmail.com",1,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=1AAstQckstviJi_3CBjkD77-NrTQKawFs",[["Anvi gautam","7620712652",1.0,"MPSTME","B.Tech"]]],["R038","2026-08-06T22:30:34.755","agrawalyana8@gmail.com",1,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=1x7QQmOZbvKGTNoxsFk-5zJLSo_Ysv5oB",[["Yana Agrawal","8871682945",1.0,"MPSTME","MBA Tech"]]],["R039","2026-08-06T23:07:09.585","kesarivaibhav5@gmail.com",1,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=1mlOcszQT3J0Hz0LCP-__6KD6IKoY1xdV",[["Vaibhav Kesari","6232879996",2.0,"MPSTME","B.Tech"]]],["R040","2026-08-06T23:17:13.480","namandugar2006@gmail.com",2,"Mirror Painting [Rs.119]","Mirror",119,"https://drive.google.com/open?id=1ShHBAcxrA85aCGn2SZKqpJAyHAqmkRW9",[["Naman Dugar","9300004501",3.0,"MPSTME","MBA Tech"],["Bijal Jain","9767072802",3.0,"MPSTME","MBA Tech"]]],["R041","2026-08-06T23:43:59.212","archiagrawal2025@gmail.com",2,"Mirror Painting [Rs.119]","Mirror",119,"https://drive.google.com/open?id=1nNgrS_a0MAXesbTM1qpKIJwF2EFann-D",[["Archi Agrawal","9328843191",2.0,"MPSTME","B.Tech"],["Aishwi Garg","7990046903",2.0,"MPSTME","B.Tech"]]],["R042","2026-08-06T23:51:57.294","jainpriyansh004@gmail.com",2,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=1A_pj6J7MS2B5AcBYYug_3kMMhwMD9-ZG",[["Priyansh Jain","8619058321",2.0,"MPSTME","B.Tech"],["Harit Dungerwal","9057277698",2.0,"MPSTME","B.Tech"]]],["R043","2026-08-06T23:58:32.270","eeshasaxena99@gmail.com",1,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=1j4NMaKLuUsjDr8a0fGCtg8JviH4KWGfK",[["Eesha Saxena","8855091940",1.0,"MPSTME","B.Tech"]]],["R044","2026-08-07T00:06:28.138","janika2908@gmail.com",1,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=16LhiptxNG2a98BfDzr_IGr6uH7BIUifG",[["Janika Soni","7487858491",1.0,"MPSTME","B.Tech"]]],["R045","2026-08-07T00:14:13.207","dinrajk2@gmail.com",2,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=1g-hi6BXFNIYn08I3_V-aYdWbKcQEoV8-",[["Dinraj Khamitkar","9021343383",2.0,"MPSTME","B.Tech"],["Koushani Bag","9343955751",2.0,"MPSTME","B.Tech"]]],["R046","2026-08-07T00:29:35.651","mahikapathak05@gmail.com",2,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=1MFEeXbh01LvqaRHN_7-AHCm2bqg_Aydz",[["Mahikaa pathak","9657836635",3.0,"MPSTME","MBA Tech"],["Suyash Dixit","7737770894",3.0,"MPSTME","MBA Tech"]]],["R047","2026-08-07T01:56:10.357","darshjaiswal009.xi@gmail.com",2,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=1H3RpLLUAEiopHWJYSULfrsm_HT0joM-N",[["Darsh Jaiswal","7822997809",3.0,"MPSTME","MBA Tech"],["Diksha Kuwar","9028686450",3.0,"MPSTME","B.Tech"]]],["R048","2026-08-07T08:37:29.437","hekare.devayani@gmail.com",2,"Mirror Painting [Rs.119], Combo [Rs.199]","Multiple-Flagged",null,"https://drive.google.com/open?id=1G5G_59m2tkpI2NrKNnWCkgom1XdxymuR",[["Devayani Hekare","9527748252",3.0,"MPSTME","B.Tech"],["Manasvi Bhardwaj","7877990960",3.0,"MPSTME","B.Tech"]]],["R049","2026-08-07T11:11:32.713","saitamaisthegod1@gmail.com",1,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=1hw1hnUxLlkMvAklKPXl1tWY2afXsUBgX",[["Pranav Mantri","8999212937",4.0,"MPSTME","B.Tech"]]],["R050","2026-08-07T11:13:14.600","ankitj2811@gmail.com",1,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=1oX0P_P11PeF0hrhSoZ_euhm89x4SCQap",[["Ankit Jangid","9588809462",4.0,"MPSTME","B.Tech"]]],["R051","2026-08-07T12:15:58.410","meetpatel132465@gmail.com",2,"Canvas and Stand [Rs.99], Combo [Rs.199]","Multiple-Flagged",null,"https://drive.google.com/open?id=1ty0xdvMXhEVxIzTSnQpi3BFZIMj2pQHQ",[["Meet Patel","9265324158",4.0,"MPSTME","B.Tech"],["Mahek Trivedi","9727306990",4.0,"MPSTME","B.Tech"]]],["R052","2026-08-07T12:41:23.103","prerna.c2818@gmail.com",2,"Mirror Painting [Rs.119]","Mirror",119,"https://drive.google.com/open?id=1hYVDlDaMt1oo7F9bYtXA2Mo9G6dP_cUZ",[["Prerna Chaudhari","9545209047",2.0,"MPSTME","B.Tech"],["Dhvani khandelwal","7678366385",2.0,"MPSTME","B.Tech"]]],["R053","2026-08-07T13:45:02.995","ishanimittal07@gmail.com",1,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=1DUpBNED9SkLqh7ZcJpO6F7_lVVE7E5_P",[["Ishani Mittal","9984457127",1.0,"MPSTME","MBA Tech"]]],["R054","2026-08-07T13:56:25.122","shouryas2909@gmail.com",2,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=1TuCWNrYqBXa27ckSzOZ7g0KoCATzvr8G",[["Shourya Sinha","8692988892",2.0,"MPSTME","MBA Tech"],["Sanjana Sinha","8850288905",2.0,"MPSTME","B.Tech"]]],["R055","2026-08-07T15:06:28.974","omkarmalve916@gmail.com",1,"Mirror Painting [Rs.119]","Mirror",119,"https://drive.google.com/open?id=1FXuqvQbSEUXshP2u_5R2mA7MpLVx9h9W",[["Omkar Malve","9529821200",1.0,"MPSTME","B.Tech"]]],["R056","2026-08-07T18:19:18.295","dhanvibhalodia@gmail.com",2,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=1S-DzWlCQ6KeKCCwn19AtaiYaDA0Fjtaq",[["Dhanvi Bhalodia","7030763873",2.0,"MPSTME","MBA Tech"],["Kavya Vithlani","9426128418",2.0,"MPSTME","MBA Tech"]]],["R057","2026-08-07T18:25:24.674","chaudhariparth2503@gmail.com",2,"Mirror Painting [Rs.119]","Mirror",119,"https://drive.google.com/open?id=1Bi1b2JjhGsrvQv7E9BUGJDvCPsR74X1-",[["Parth chaudhari","9730569648",2.0,"MPSTME","B.Tech"],["Mrunal girase","8208998031",2.0,"MPSTME","B.Tech"]]],["R058","2026-08-07T18:39:32.819","ekagrabansal05@gmail.com",2,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=1f0T6cGUqoa3olvoTXnXYdG2L5fTvPCRb",[["Sanskruti Gupta","9890573752",3.0,"MPSTME","MBA Tech"],["Ekagra Bansal","8529452284",3.0,"MPSTME","MBA Tech"]]],["R059","2026-08-07T19:40:24.494","praveshg202@gmail.com",1,"Mirror Painting [Rs.119]","Mirror",119,"https://drive.google.com/open?id=1CpRR8F7FKB2pZCOFMPc7uYjH4SDly_C7",[["Pravesh garg","9303209850",2.0,"MPSTME","B.Tech"]]],["R060","2026-08-07T19:50:58.617","anand.aashika03@gmail.com",2,"Mirror Painting [Rs.119]","Mirror",119,"https://drive.google.com/open?id=12hPsDXfhwlu4iQgYkdgjdPNUXalQ4q6j",[["Aashika","8779409122",2.0,"MPSTME","B.Tech"],["Ruchir","9920603748",2.0,"MPSTME","B.Tech"]]],["R061","2026-08-07T19:56:10.048","heetjala21@gmail.com",2,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=1A9ZNW95DH7PwRcgYzQoq04xl54BSuNM2",[["Heet Jala","7709002180",2.0,"MPSTME","MBA Tech"],["Manan Khandelwal","8905830940",2.0,"MPSTME","MBA Tech"]]],["R062","2026-08-07T20:03:18.403","dhanvibhalodia@gmail.com",1,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=1zYbuJcslPqJT4gjWuIzPi1POTlqgwf-s",[["Priyansh Koshti","7249383805",2.0,"MPSTME","MBA Tech"]]],["R063","2026-08-07T20:05:17.010","bha9706vya@gmail.com",2,"Mirror Painting [Rs.119]","Mirror",119,"https://drive.google.com/open?id=18kC4JzKCUjZnEg6X05wPBfSPDM_FU9an",[["Bhavya Tiwari","8850215982",2.0,"MPSTME","B.Tech"],["Arpita Katariya","8830032114",2.0,"MPSTME","B.Tech"]]],["R064","2026-08-07T20:05:51.428","nickrdrg26@gmail.com",2,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=1qUgtDfhi6BCugxEGxzA8XNdT5i46N9bq",[["drishti","9265541810",3.0,"SPTM","B.Pharm"],["nicole","9594652611",3.0,"SPTM","B.Pharm"]]],["R065","2026-08-07T20:05:56.143","nishthamathur03@gmail.com",2,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=11C9xNaJr3e6i_HbEOZr438aQcUh3ei0q",[["Nishtha","9136127059",2.0,"MPSTME","B.Tech"],["Parth","8905235591",2.0,"MPSTME","B.Tech"]]],["R066","2026-08-07T20:42:57.321","gehlotyash.2005@gmail.com",1,"Mirror Painting [Rs.119]","Mirror",119,"https://drive.google.com/open?id=1ySdruHWR_ENM9Lx49DW-jFgxmFFpBuOe",[["Yash Gehlot","7425026211",4.0,"MPSTME","B.Tech"]]],["R067","2026-08-07T20:44:35.790","pushpakp1608@gmail.com",1,"Mirror Painting [Rs.119]","Mirror",119,"https://drive.google.com/open?id=1TbFG7NyE4CCnu0nZVY58fN3OCvgJVVtI",[["Pushpak Patel","9082399904",2.0,"MPSTME","B.Tech"]]],["R068","2026-08-07T21:28:39.481","nidhimehta212005@gmail.com",1,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=1pPpGeqxftAHND3F0MyKxatZY7mO5BTD0",[["Nidhi mehta","8433604870",3.0,"SPTM","B.Pharm"]]],["R069","2026-08-07T21:44:12.027","chhabramanya26@gmail.com",1,"Mirror Painting [Rs.119]","Mirror",119,"https://drive.google.com/open?id=1vqScf5Y3-3tyVvtK1FLmkgDwBFErxGMb",[["Manya Chhabra","9650898282",2.0,"MPSTME","MBA Tech"]]],["R070","2026-08-07T22:32:19.415","agrawalritika32@gmail.com",1,"Mirror Painting [Rs.119]","Mirror",119,"https://drive.google.com/open?id=1qEjdt_v2kpnZzAQ_DbS_tnde8VTDVQkq",[["Ritika Agrawal","9315828519",2.0,"MPSTME","MBA Tech"]]],["R071","2026-08-08T07:42:38.912","rathodhimanshu0707@gmail.com",1,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=14rnmHVYYEYyd8apgSFIW515S1vLGmfEf",[["Himanshu Rathod","9529756631",2.0,"MPSTME","MBA Tech"]]],["R072","2026-08-08T11:16:30.598","iteeyadav8@gmail.com",2,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=10od8maALEhfL6aC5EIbOlqY07LzrOFa8",[["Itee yadav","7533895628",3.0,"MPSTME","B.Tech"],["Pratham deore","9227097236",3.0,"MPSTME","B.Tech"]]],["R073","2026-08-08T11:19:36.482","azmeesohana@gmail.com",1,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=1jh8sFQVx5YNBjC-bQZXVS5lKpCvcfjRx",[["Sohana Azmee","7001452754",1.0,"MPSTME","MBA Tech"]]],["R074","2026-08-08T11:19:39.266","goyalritvi@gmail.com",2,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=1XGmhUebLNSb7eCJAa3b4izGmL4pXklK7",[["Ayush khairnar","8080376904",2.0,"MPSTME","B.Tech"],["Ritvi goyal","9887877200",2.0,"MPSTME","MBA Tech"]]],["R075","2026-08-08T12:06:51.566","shiv.pithva2007@gmail.com",1,"Mirror Painting [Rs.119]","Mirror",119,"https://drive.google.com/open?id=15Ta1OHCQnpWw58qscPR15_YG8QD4wN52",[["Shiv Pithva","9558094060",2.0,"MPSTME","B.Tech"]]],["R076","2026-08-08T13:00:47.732","parv5626@gmail.com",1,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=1EOSf_g7SgExba7LvuatMXM2Nr1kCN6DU",[["Parv Khandelwal","7877416550",2.0,"MPSTME","MBA Tech"]]],["R077","2026-08-08T13:22:33.696","gaathapatel2005@gmail.com",2,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=1mExBL2bdUCHHENGQPu_9c5LVexAlg9dg",[["Gaatha Patel","9409240298",4.0,"MPSTME","B.Tech"],["Shruti Mishra","9407487672",4.0,"MPSTME","B.Tech"]]],["R078","2026-08-08T13:22:55.264","kavishh11shahh@gmail.com",1,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=1KqsxAsTFcsHCSLUnNliPCgaQiGfv5g5_",[["Kavish","8401739413",1.0,"MPSTME","B.Tech"]]],["R079","2026-08-08T13:29:25.617","vanishasharma012@gmail.com",2,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=1RWmJ8I4tykb84OABfvkywWvNiON-FOhX",[["Vanisha sharma","9826525545",4.0,"MPSTME","B.Tech"],["Dhyani shah","6269343092",4.0,"MPSTME","B.Tech"]]],["R080","2026-08-08T14:28:19.615","aashya.sinha@gmail.com",1,"Mirror Painting [Rs.119]","Mirror",119,"https://drive.google.com/open?id=1lsjNRKnb9QSD0Z3wULdo92S8RoBB6-UE",[["Aashya Sinha","8319488857",3.0,"MPSTME","B.Tech"]]],["R081","2026-08-08T15:08:52.110","ashishkumarp2003@gmail.com",1,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=1rBU2iAjiUTIf3YrRLe3tpL8-6zlsqfqU",[["Ashish Kumar Prajapati","9601627217",2.0,"SPTM","B.Pharm + MBA"]]],["R082","2026-08-08T15:15:53.305","harshitapraneet@gmail.com",2,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=14RweSk1EfyucN07vFFiQqg_gN8GNiEvf",[["Harshita Praneet","9142135204",1.0,"MPSTME","MBA Tech"],["Virti Parakh","8818927175",1.0,"MPSTME","MBA Tech"]]],["R083","2026-08-08T15:49:08.517","keshvi.mittal22@gmail.com",2,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=1OJQvKtUqZ4jGOM4urrUZJGPBaWfED1Hc",[["Keshvi mittal","9617002070",2.0,"MPSTME","B.Tech"],["Vibhutiii girase","7548805813",2.0,"MPSTME","B.Tech"]]],["R084","2026-08-08T18:00:49.704","rudrakapadia88@gmail.com",1,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=11im437_thrMZgkZmzAPjz0NGA_wphRLw",[["Rudra kapadia","7874361299",1.0,"MPSTME","B.Tech"]]],["R085","2026-08-08T18:07:43.321","yp20082007@gmail.com",1,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=14GWTFwz2D48jUxGQIDVOWjMPzGHNCvJ8",[["Yogita patil","9130152368",3.0,"MPSTME","B.Tech"]]],["R086","2026-08-08T18:09:55.656","shrawanilande1@gmail.com",2,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=13BNEtubivOUjCda9T-mc02keO5WL_ubU",[["Shrawani Lande","9372498755",2.0,"MPSTME","B.Tech"],["Khwahish Dodi","6261016283",2.0,"MPSTME","B.Tech"]]],["R087","2026-08-08T18:53:23.710","jiyakasundra2702@gmail.com",2,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=1-T-558khcKhNkZ7J2O5iiZjhtqKFgk2r",[["Jiya Patel","9727087653",3.0,"MPSTME","B.Tech"],["Sharva Shenoy","9136287570",2.0,"MPSTME","B.Tech"]]],["R088","2026-08-08T19:16:31.904","sawanthimani95@gmail.com",2,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=1RLUvri5MgQRtDX8nMplg6euTnp16Gl_o",[["Himani Sawant","9403712810",1.0,"MPSTME","B.Tech"],["Shreyanshi pipare","9753815421",2.0,"MPSTME","B.Tech"]]],["R089","2026-08-08T20:33:39.073","rashikanarolia@gmail.com",1,"Mirror Painting [Rs.119]","Mirror",119,"https://drive.google.com/open?id=1j_TLh9Vq_bVQZwx9pIMUUNGWA2fi9dx8",[["Rashika","8521111115",3.0,"MPSTME","MBA Tech"]]],["R090","2026-08-08T21:07:37.561","vengurlekartanisha@gmail.com",2,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=1yD_O_KRXlKUVQ6xX_jwuY7DwRcpQNS6E",[["Tanisha Vengurlekar","7506840628",2.0,"MPSTME","B.Tech"],["Bhumika Agrawal","7869777503",2.0,"MPSTME","B.Tech"]]],["R091","2026-08-08T21:44:53.962","smrutibkayarwar@gmail.com",2,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=193SgcXvgflkwroC9O65DaOMdA2BiHhKd",[["Smruti Kayarwar","9321752018",2.0,"MPSTME","B.Tech"],["Tanisha Chouhan","9399838317",2.0,"MPSTME","B.Tech"]]],["R092","2026-08-08T22:34:01.908","anveshadongre@gmail.com",2,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=1HjZfLD4CYXOhKUOvKfEiix6xZGL--pC8",[["Anvesha Dongre","7389377978",1.0,"MPSTME","B.Tech"],["Anshika mukati","9424043982",1.0,"MPSTME","B.Tech"]]],["R093","2026-08-08T22:44:37.502","vidhyashah8857@gmail.com",1,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=1Ik2HybV1Qx62RdPhvY99mwq_1gsa06Ig",[["Vidhya shah","9687142484",1.0,"MPSTME","B.Tech"]]],["R094","2026-08-08T22:47:48.759","ttraditi0608@gmail.com",1,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=12aOwzTD4d72cyiMfwsLLyXyHOKIqtV2E",[["Aditi","9137993573",1.0,"MPSTME","B.Tech"]]],["R095","2026-08-08T22:55:28.726","bhaktiparmar577@gmail.com",2,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=1rJRafnW_ug_n5ak0tArZxev04cEPGJSV",[["Bhakti kiran parmar","9130199172",1.0,"MPSTME","MBA Tech"],["Sayontini Das","9967014565",1.0,"MPSTME","MBA Tech"]]],["R096","2026-08-08T23:05:37.591","gayatrimarathe38@gmail.com",1,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=1WzlLyx7hZ1OEmjd4euRaIdMDkoWvPxvU",[["Gayatri Marathe","8767755053",1.0,"MPSTME","B.Tech"]]],["R097","2026-08-08T23:09:20.219","kamakshithakkar8@gmail.com",1,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=1ft-Zw1k67jawNWayLg5HRyLvHF93Q9Ys",[["Kamakshi Thakkar","9373089611",1.0,"MPSTME","B.Tech"]]],["R098","2026-08-08T23:12:57.730","anushkak2311@gmail.com",1,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=1DiJYsGLMa1b9dkrrMYaeKlUXal7-9ECe",[["Anushka Kadambande","9359392268",1.0,"MPSTME","B.Tech"]]],["R099","2026-08-08T23:27:05.369","daporkarn@gmail.com",2,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=1A7wk2zVWRsfFCE14l4rCjjL4rqgS_wrb",[["Urmi Thakor","9512738892",1.0,"MPSTME","B.Tech"],["Nishtha Daporkar","7692877909",1.0,"MPSTME","B.Tech"]]],["R100","2026-08-08T23:39:05.736","pahaljain0907@gmail.com",2,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=1_ZPic5Z_-NtPsIWbgZ0BMtdn_n5PzPAc",[["Pahal Jain","9753325341",1.0,"MPSTME","B.Tech"],["Tanvi Jain","7389764486",1.0,"MPSTME","B.Tech"]]],["R101","2026-08-09T00:16:35.969","shreeja.ag10@gmail.com",1,"Mirror Painting [Rs.119]","Mirror",119,"https://drive.google.com/open?id=1hv1WR4D9srPuI6FAbi13UFt0hWgSQZEQ",[["Shreeja Agrawal","8690014145",4.0,"MPSTME","B.Tech"]]],["R102","2026-08-09T00:32:43.827","rujulyerne@gmail.com",2,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=1IK6N_b-rwkAZeMZk0vSGYdQOA8FdrJVN",[["Rujul","8010136268",1.0,"MPSTME","B.Tech"],["Jaydev","8380962500",2.0,"MPSTME","MBA Tech"]]],["R103","2026-08-09T00:38:52.941","jaydevsingrajput2711@gmail.com",2,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=18LllfzpEFTrZ_4Om9SuftrCLp2yYpjUs",[["JAYDEVSING RAJPUT","08380962500",2.0,"MPSTME","MBA Tech"],["RUJUL YERNE","8010136268",1.0,"MPSTME","B.Tech"]]],["R104","2026-08-09T08:23:36.064","yashchakkarwar7@gmail.com",2,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=1TzDt-vDtduYTLll7k8mkcdtpzrIGbytr",[["Yash Chakkarwar","9028002956",2.0,"SPTM","B.Pharm + MBA"],["Prachita padhy","9104403582",2.0,"SPTM","B.Pharm + MBA"]]],["R105","2026-08-09T10:51:18.096","diyakotharii24@gmail.com",2,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=1NlTVXevPszSSy5dzvWQPa09vr2SR8DpK",[["Diya Kothari","9460444344",1.0,"MPSTME","B.Tech"],["Swara Jain","9116736952",1.0,"MPSTME","B.Tech"]]],["R106","2026-08-09T10:57:25.805","swarajain0308@gmail.com",2,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=1r-k4rkRiJSBQLIsSHS-GShvBItwx5wzK",[["Diya kothari","9460444344",1.0,"MPSTME","B.Tech"],["Swara jain","9116736952",1.0,"MPSTME","B.Tech"]]],["R107","2026-08-09T11:27:51.894","vexonbhai@gmail.com",1,"Mirror Painting [Rs.119]","Mirror",119,"https://drive.google.com/open?id=1IWhlI3eKI3bdHcuk5tutPcKMk_ix2cqh",[["Hitendra Girase","9409643907",2.0,"MPSTME","B.Tech"]]],["R108","2026-08-09T11:40:01.535","bhagyashritalele1388@gmail.com",2,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=1WOTF2VHaR6Dn9OpyQsKYq0gKC2vsv4iP",[["Mahi gupta","9238652352",1.0,"MPSTME","B.Tech"],["Bhagyashri talele","9175571227",1.0,"MPSTME","B.Tech"]]],["R109","2026-08-09T11:40:54.775","taletiyanimit@gmail.com",2,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=1V_Fn6_ZVC3oxVT1pVYuywDajZvwsCMyj",[["NIMIT TALETIYA","8114436434",1.0,"MPSTME","B.Tech"],["Homage shah","9166131693",1.0,"MPSTME","B.Tech"]]],["R110","2026-08-09T11:41:15.257","homage0609@gmail.com",2,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=1grlDw6zln6E_-VDRHpKACmd5CY9ugGfP",[["NIMIT TALETIYA","88114436434",1.0,"MPSTME","B.Tech"],["HOMAGE SHAH","9166131693",1.0,"MPSTME","B.Tech"]]],["R111","2026-08-09T13:24:42.152","srichas2007@gmail.com",2,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=1zS1S1cXCEWt-SND6LGwxZTAsdfQQjrLA",[["RICHA SHARMA","9687340446",1.0,"MPSTME","B.Tech"],["SHRUTI MORE","8237150611",1.0,"MPSTME","B.Tech"]]],["R112","2026-08-09T13:27:38.588","rudrakoregave@gmail.com",1,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=1AunW_vIUS_SQo_nkfiRQeAastPYqPDgG",[["Rudra Koregave","9819496450",1.0,"MPSTME","B.Tech"]]],["R113","2026-08-09T13:27:45.500","tumirdgajjar31@gmail.com",2,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=1q0gShqeld64Wa7rZD6u74_3Bi8_b2gpy",[["Tumir Gajjar","7720900017",1.0,"MPSTME","B.Tech"],["Keshav Tripathi","9354287148",1.0,"MPSTME","B.Tech"]]],["R114","2026-08-09T13:33:41.309","sharmashashwat2008@gmail.com",2,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=1ssO7Vnq5nnNDKWOppJefyWJ2gEGltJya",[["Shashwat sharma","9244089633",1.0,"MPSTME","B.Tech"],["Neel nahar","8788257470",1.0,"MPSTME","B.Tech"]]],["R115","2026-08-09T14:12:51.973","y0372998@gmail.com",1,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=1QXvmhAeGvfO6_Xs3fAf-4FG-nEa21sKB",[["Yashvi Patel","6351919951",1.0,"MPSTME","B.Tech"]]],["R116","2026-08-09T14:24:30.222","akshitsinghrajpoot@gmail.com",2,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=1N7ioLf-rEmOo9rhnhT_NKiu5iAn_p_vD",[["Atharva dhole","9423544109",1.0,"MPSTME","B.Tech"],["Soham dolas","8928181791",1.0,"MPSTME","B.Tech"]]],["R117","2026-08-09T14:29:12.541","goyaladiti0819@gmail.com",2,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=1k7in3OPpoEo2kKcg1nx7fMKM-3XB-bK_",[["Aditi Goyal","9981253916",1.0,"MPSTME","B.Tech"],["Jiya Patil","7374841033",1.0,"MPSTME","B.Tech"]]],["R118","2026-08-09T14:43:28.588","rajputvarsha1710@gmail.com",2,"Mirror Painting [Rs.119]","Mirror",119,"https://drive.google.com/open?id=1Ngdz_NPwdRKWvwHT9ar0BLMagr0k7d_c",[["Sneha Rajput","7509538804",2.0,"MPSTME","B.Tech"],["Kavya Tiwari","7879113359",2.0,"MPSTME","B.Tech"]]],["R119","2026-08-09T15:29:03.953","ilsak098765@gmail.com",1,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=1Tu5G31mntrBp0yuEfPMgBsEbKX5atkk4",[["Ilsa","9244634582",2.0,"MPSTME","B.Tech"]]],["R120","2026-08-09T15:32:14.566","laviza07khan@gmail.com",1,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=14ak_cyhkRfEExbRGgsaFmHlqXsbnORLA",[["Laviza khan","8319687756",2.0,"MPSTME","B.Tech"]]],["R121","2026-08-09T15:36:51.230","shriniketstudy@gmail.com",1,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=1QAQH-4PslbQl_JfBQRAKWrciWSCWIa5V",[["Shriniket Awate","7822934028",3.0,"MPSTME","B.Tech"]]],["R122","2026-08-09T15:39:05.043","ilsak098765@gmail.com",1,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=17RcqRyVhXn-2CPOF6x-xHIssEaf42NUS",[["Alok yadav","9369160717",3.0,"MPSTME","B.Tech"]]],["R123","2026-08-09T17:15:20.190","janika2908@gmail.com",1,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=1XcaEx6hGiMsQua5E1k78rFsskdk6WMxt",[["Disha Chandore","7067916834",1.0,"MPSTME","B.Tech"]]],["R124","2026-08-09T18:03:06.718","shouryalohar26@gmail.com",2,"Canvas and Stand [Rs.99], Combo [Rs.199]","Multiple-Flagged",null,"https://drive.google.com/open?id=13gVrEk8wO1ps_7qcpuzGmHQtyapg-xO9",[["Shourya Lohar","7972779636",2.0,"MPSTME","B.Tech"],["Mishti Arora","9924997700",3.0,"SPTM","B.Pharm + MBA"]]],["R125","2026-08-09T19:01:55.727","hiralbansal18@gmail.com",2,"Mirror Painting [Rs.119]","Mirror",119,"https://drive.google.com/open?id=14q8UAfVC1ccGES8_qLy2zDS4NaFAaFAn",[["Hiral Bansal","7440886878",1.0,"MPSTME","B.Tech"],["Swarnika Chundawat","8964889684",1.0,"MPSTME","B.Tech"]]],["R126","2026-08-09T19:04:17.747","patidarlakshya04@gmail.com",2,"Mirror Painting [Rs.119]","Mirror",119,"https://drive.google.com/open?id=1IAtZzSYAKwUSsBWf8xNXPc3SzLRvOVGn",[["Lakshya Patidar","9343476404",1.0,"MPSTME","B.Tech"],["Harshil Ahir","8849162628",1.0,"MPSTME","B.Tech"]]],["R127","2026-08-09T19:10:13.841","atharv.thakre22@gmail.com",2,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=1dGjrAQ9ldB1EVEoCAsDaZQwufmBzcZyA",[["Atharv Thakre","8766529911",1.0,"MPSTME","MBA Tech"],["Pratyaksh Chaudhary","8595814701",1.0,"MPSTME","MBA Tech"]]],["R128","2026-08-09T19:19:57.384","omchaudhari023@gmail.com",2,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=1bBabUky2aVd0kfOW4N8ygXEjGGINUEYx",[["Om Chaudhari","7219829675",1.0,"MPSTME","B.Tech"],["Mihika Shroff","9301221554",1.0,"MPSTME","MBA Tech"]]],["R129","2026-08-09T19:38:08.751","pulkitsingh1212@gmail.com",1,"Mirror Painting [Rs.119]","Mirror",119,"https://drive.google.com/open?id=1VLDXuIb7gFAdchdIuOhRqpVq58BarTMB",[["Pulkit Singh","8269193885",2.0,"MPSTME","B.Tech"]]],["R130","2026-08-09T20:00:48.796","sarangidesale380@gmail.com",2,"Mirror Painting [Rs.119]","Mirror",119,"https://drive.google.com/open?id=1I_t54LgpTu75WeZ6SXR1neKd8kIL84KA",[["Sarangi Desale","7757888235",1.0,"MPSTME","B.Tech"],["Aadhya Agrawal","8827837171",1.0,"MPSTME","B.Tech"]]],["R131","2026-08-09T20:02:25.542","kunjdesai28@gmail.com",2,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=1L4TswQ5ve8kXj11nqxXDEMcqa8uN6xYW",[["Kunj Desai","9409529800",4.0,"MPSTME","B.Tech"],["Rishabh Mehta","7045301148",4.0,"MPSTME","B.Tech"]]],["R132","2026-08-09T21:11:21.766","racheljohn2006@gmail.com",1,"Mirror Painting [Rs.119]","Mirror",119,"https://drive.google.com/open?id=1pYeMeF7bT6Fng0YfqSx0H6L_jfBbMowr",[["Rachel K John","9819948855",2.0,"MPSTME","MBA Tech"]]],["R133","2026-08-09T21:19:34.955","charvijain2103@gmail.com",1,"Mirror Painting [Rs.119]","Mirror",119,"https://drive.google.com/open?id=1N-0Hyv1pJTLBAEWlK7KjvJ9LYM_I2xLt",[["Charvi Jain","9119367234",2.0,"MPSTME","MBA Tech"]]],["R134","2026-08-09T21:26:57.422","princemandot07@gmail.com",2,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=1Hf1TKXMREBlKnc5KtLh8kbkmCBYEpii2",[["Prince mandot","7597389554",1.0,"MPSTME","B.Tech"],["Parth khandelwal","9028176881",1.0,"MPSTME","B.Tech"]]],["R135","2026-08-09T21:42:04.604","kabirpunjabi07@gmail.com",2,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=10qH8S2EhDSHhXWPbvzvg4DDdHr9XHond",[["Kabir Punjabi","7715842693",1.0,"MPSTME","MBA Tech"],["Dhrati Mehta","7987479684",1.0,"MPSTME","MBA Tech"]]],["R136","2026-08-09T21:45:35.349","ammusingh2007@gmail.com",2,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=14XFGkjyBV2eYRnvRrJcVXfCgdn5VwE87",[["Aman Singh","",2.0,"MPSTME","B.Tech"],["Arnav Barde","9175962468",2.0,"MPSTME","MBA Tech"]]],["R137","2026-08-09T22:01:53.304","srushtigujarathi1603@gmail.com",2,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=1YDFyw-EgLFHiGjo942U8H5jmiNpSaMrS",[["Srushti gujarathi","9699237459",1.0,"MPSTME","B.Tech"],["Atharva wani","9529195498",2.0,"MPSTME","B.Tech"]]],["R138","2026-08-09T22:07:49.618","jhaaryan2405@gmail.com",2,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=11LRx5AYosCkicKCfVd7C522BiRp-NO7P",[["Aryan jha","9128924948",1.0,"MPSTME","B.Tech"],["Asmit pal","9214378383",1.0,"MPSTME","B.Tech"]]],["R139","2026-08-09T22:22:00.017","harshitsinghavi10@gmail.com",2,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=137R8LRD9n5GZbKVTPNp0PG-94FSNMUMH",[["Harshit singhavi","9420042462",1.0,"MPSTME","MBA Tech"],["Prachi Chaudhari","7020738439",1.0,"MPSTME","MBA Tech"]]],["R140","2026-08-09T22:24:08.692","maishasarkar56@gmail.com",2,"Mirror Painting [Rs.119]","Mirror",119,"https://drive.google.com/open?id=1SfqsuJn_jr2eO3-uErvqnSzP9dVvwEtu",[["Maisha Sarkar","9313704560",1.0,"MPSTME","B.Tech"],["Khushi Sharma","9879724579",1.0,"MPSTME","B.Tech"]]],["R141","2026-08-09T22:44:59.059","aneekmahajan7@gmail.com",2,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=1oOXWLFi5PAiJNYwvlr4vaPYMSxMh-HiO",[["Aneek Mahajan","9424554547",1.0,"MPSTME","B.Tech"],["Samarth Jadhav","9404220437",1.0,"MPSTME","B.Tech"]]],["R142","2026-08-09T22:56:45.785","jaayush1982@gmail.com",2,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=1txL_428MPcBli398Z2yKL-ZKYF1wnCLF",[["Abhi Jain","8209821252",1.0,"MPSTME","B.Tech"],["Mahi Lunavia","7096150408",1.0,"MPSTME","B.Tech"]]],["R143","2026-08-09T22:57:22.828","shashankpatel6475@gmail.com",2,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=19fcyeSD4HeB_MfctJ4gYtR4753Zs8ONB",[["Shashank patel","9201005082",1.0,"MPSTME","B.Tech"],["Kabir dandir","7440387616",1.0,"MPSTME","B.Tech"]]],["R144","2026-08-09T23:00:47.061","yagneshasvyas@gmail.com",2,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=18XxUwI5zuUUa7xTpjzUFQNY1ZR_ikt6r",[["Yagnesh Vyas","9826055011",1.0,"MPSTME","B.Tech"],["Soumya Neema","7805935558",1.0,"MPSTME","B.Tech"]]],["R145","2026-08-09T23:06:46.846","bijaljain481@gmail.com",1,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=19S-_8tvYuKYhKey7lAQXRza-ezlpDrK1",[["Vedakshi Oswal","9136117116",3.0,"MPSTME","B.Tech"]]],["R146","2026-08-09T23:24:20.969","www.shubhamvyas246@gmail.com",1,"Mirror Painting [Rs.119]","Mirror",119,"https://drive.google.com/open?id=17l7P5JZ1zZE_2lK953DwlSQT4t_TeZU2",[["Shubham Vyas","9694740001",1.0,"MPSTME","B.Tech"]]],["R147","2026-08-09T23:27:08.056","rohanshishende@gmail.com",2,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=1VghNB__tCLYTEU8qhUk_k5KnuvTOCaK4",[["Rohanshi Shende","8888903139",1.0,"MPSTME","B.Tech"],["Jiya sheikh","7049434343",1.0,"MPSTME","B.Tech"]]],["R148","2026-08-09T23:29:28.219","kostubhtoshniwal04@gmail.com",2,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=1EBd-NMwm3QkBzUKNmKJ__RwFcPL1_xXF",[["Kostubh Toshniwal","8209642312",1.0,"MPSTME","MBA Tech"],["Aastha bhartia","7877254389",1.0,"MPSTME","MBA Tech"]]],["R149","2026-08-09T23:32:20.224","avikabarve@gmail.com",2,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=1wyKEq4MEKg7tmIDEcNbK3vdyo-kwzyjO",[["Avika Barve","9770288783",1.0,"MPSTME","MBA Tech"],["Diya Patel","7043584850",1.0,"MPSTME","MBA Tech"]]],["R150","2026-08-09T23:33:37.808","sohamdhok2008@gmail.com",2,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=1qjU9BAmRBJc_rFV-bF90AyBA2csZ8w6-",[["Palaskhi Verma","9370206500",1.0,"MPSTME","MBA Tech"],["Soham Dhok","7507909006",1.0,"MPSTME","B.Tech"]]],["R151","2026-08-09T23:36:26.040","shubhikaswn94@gmail.com",2,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=1J2WMYKr1Cu5f-Z7V6utXdQBwstLusCb9",[["Shubhika Swarnkar","9529949114",1.0,"MPSTME","MBA Tech"],["Divyanka Rahad","9321646165",1.0,"MPSTME","MBA Tech"]]],["R152","2026-08-09T23:41:09.648","aaradhyac1409@gmail.com",2,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=1IGLdxfAsgT5kx10s6Ztdw2la21Kbw4qZ",[["Aaradhya Chandak","8484960963",1.0,"MPSTME","MBA Tech"],["Prekshak Mittal","9530224929",1.0,"MPSTME","MBA Tech"]]],["R153","2026-08-10T00:01:52.776","spandanamrutkar@gmail.com",2,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=1aBDZ-RGX2fCa06SSEeSNmBhQ-Py2OcsW",[["Spandan Amrutkar","7775800800",2.0,"MPSTME","MBA Tech"],["Omkar Borade","7058131477",2.0,"MPSTME","MBA Tech"]]],["R154","2026-08-10T00:37:55.012","goyalritvi@gmail.com",2,"Mirror Painting [Rs.119]","Mirror",119,"https://drive.google.com/open?id=1WdKlo6da2NoZ9e0jnKpoH73s3aB3NGxl",[["Ritvi goyal","9887877200",2.0,"MPSTME","MBA Tech"],["Ayush khairnar","8080376904",2.0,"MPSTME","B.Tech"]]],["R155","2026-08-10T02:19:42.801","adityathukral23@gmail.com",2,"Mirror Painting [Rs.119]","Mirror",119,"https://drive.google.com/open?id=1bs6y-njdWS0Gf6R9LLGIi6UAXQUUHLv2",[["Aditya Thukral","9999258697",2.0,"MPSTME","B.Tech"],["Piyush Kumar","9608244903",2.0,"MPSTME","B.Tech"]]],["R156","2026-08-10T09:38:32.286","bhagyashritalele1388@gmail.com",2,"Mirror Painting [Rs.119]","Mirror",119,"https://drive.google.com/open?id=1xcAtr7VXbeL-aU9gMTkq_Iz8i0GSKXTi",[["Bhagyashri","9175571227",1.0,"MPSTME","B.Tech"],["Anvi","7620712652",1.0,"MPSTME","B.Tech"]]],["R157","2026-08-10T10:28:43.658","kavyvanawat1210@gmail.com",1,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=1guqJ0kC5QB444JtNIZm599vlMXZ_hrnB",[["Kavy vanawat","8107160396",2.0,"MPSTME","B.Tech"]]],["R158","2026-08-10T11:36:04.949","smrutibkayarwar@gmail.com",2,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=1I3yL5TQnRBKm92nrjnNyaGLPaBUYZkC_",[["Dhaval Patil","8329788288",2.0,"MPSTME","B.Tech"],["Anushka Patil","8421843646",3.0,"MPSTME","B.Tech"]]],["R159","2026-08-10T11:36:07.031","nachiketkhelkar@gmail.com",1,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=1WYVFyPOuADy301UsPUJn18m_Z17U2deY",[["Yash Khelkar","8602647649",2.0,"MPSTME","B.Tech"]]],["R160","2026-08-10T11:44:28.837","toshniwalparth85@gmail.com",2,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=1xbmvTFvb8obi3ucKicFgWv0v3_cTa_hY",[["Parth Toshniwal","8381077077",3.0,"MPSTME","MBA Tech"],["Arihant Soni","8788047342",3.0,"MPSTME","MBA Tech"]]],["R161","2026-08-10T11:51:29.347","tanishkaa0204@gmail.com",1,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=1aPDwE9S8u2XPSDHuEPgRGqn9Oe8lD9kX",[["Tanishka Jain","887907369",2.0,"MPSTME","B.Tech"]]],["R162","2026-08-10T13:19:53.815","chinmai3680@gmail.com",1,"Mirror Painting [Rs.119]","Mirror",119,"https://drive.google.com/open?id=1yVG-N8vaMz1iXWDhH96A_PdRgay3iXnA",[["Chinmai patil","7588309363",3.0,"MPSTME","B.Tech"]]],["R163","2026-08-10T13:39:42.295","pawhasbhardwaj@gmail.com",2,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=1w7gsTmoCWIIfljmmT1UW4ZekhnQ1GqKP",[["Pawhas Bhardwaj","8329925517",1.0,"MPSTME","MBA Tech"],["Rahul Raj","6299135005",1.0,"MPSTME","MBA Tech"]]],["R164","2026-08-10T13:43:34.420","vishal7bhalaji@gmail.com",1,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=1HUlp5UZuTSFIMNizShBMdzFbvYsiKaj-",[["VISHAL BHALAJI S","8810450653",2.0,"MPSTME","B.Tech"]]],["R165","2026-08-10T14:25:19.941","vanshika112007@gmail.com",2,"Mirror Painting [Rs.119]","Mirror",119,"https://drive.google.com/open?id=1yWEIPWOOI_W3kjJ7Lrr06kc_Mwc2VfE8",[["Vanshika Singh","7821951399",2.0,"MPSTME","MBA Tech"],["Soham shinkar","9272053794",2.0,"MPSTME","B.Tech"]]],["R166","2026-08-11T21:53:13.829","nilanshsinghal10@gmail.com",2,"Mirror Painting [Rs.119], Combo [Rs.199]","Multiple-Flagged",null,"https://drive.google.com/open?id=1v7Ten8ePq5luS2w6DTFak9dgq2X1JB31",[["Nilansh Singhal","8250628808",2.0,"MPSTME","B.Tech"],["Swati Tiwari","8250628808",2.0,"MPSTME","MBA Tech"]]],["R167","2026-08-11T21:55:32.053","ronitgandhi215@gmail.com",2,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=1gTMw8oi-2AoGZT_j744stxIGExgc7PWO",[["Ronit Gandhi","9558690698",4.0,"MPSTME","B.Tech"],["Gurjot Singh","8209708233",4.0,"MPSTME","B.Tech"]]],["R168","2026-08-11T21:59:50.305","ankhairnar1@gmail.com",2,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=16D5knMsxa0BDJQQdWGeWfNoKNBCIzp6b",[["Aditya Khairnar","7588734134",3.0,"MPSTME","B.Tech"],["Anusha Jain","9730556156",3.0,"MPSTME","B.Tech"]]],["R169","2026-08-11T22:00:11.116","rajputvarsha1710@gmail.com",2,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=1NIRIhkLirtEHLNtaMFwg3R1p03Gi5fIp",[["Aditya Dahite","9689679432",2.0,"MPSTME","B.Tech"],["Prakruti Agrawal","9039824183",2.0,"MPSTME","B.Tech"]]],["R170","2026-08-11T22:05:51.215","siyabagmar31@gmail.com",2,"Mirror Painting [Rs.119]","Mirror",119,"https://drive.google.com/open?id=1NsqY5qdWrTa3JWu-106N-_A1MvcgAvIN",[["Siya Bagmar","9529350357",2.0,"MPSTME","MBA Tech"],["Naksh gandhi","6350127483",2.0,"MPSTME","B.Tech"]]],["R171","2026-08-11T22:06:24.599","silvipatel0706@gmail.com",2,"Mirror Painting [Rs.119]","Mirror",119,"https://drive.google.com/open?id=1bOogKo3l3MgSYwxkc-gVEAmOKYFuGgwU",[["Silvi Patel","9574212220",2.0,"MPSTME","B.Tech"],["Yashvi Patel","9227161016",2.0,"MPSTME","B.Tech"]]],["R172","2026-08-11T22:06:35.373","agrawalatharva29@gmail.com",2,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=1h5tR23QbcOUQAX-sxMp1-FdfwJjZb6YB",[["Atharva Agrawal","9209256722",2.0,"MPSTME","B.Tech"],["Divya","9209256722",2.0,"MPSTME","B.Tech"]]],["R173","2026-08-11T22:08:26.934","shvenivora7067@gmail.com",2,"Mirror Painting [Rs.119]","Mirror",119,"https://drive.google.com/open?id=19xpwmafJ6X-TdJHYYs1e8OsOOOc2txw5",[["Shveni Vora","6353170034",2.0,"MPSTME","B.Tech"],["Ved Mistry","9898164659",2.0,"MPSTME","B.Tech"]]],["R174","2026-08-11T22:08:29.363","shreyasnair002@gmail.com",1,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=10IZHvA3cYnhQGeH-TUG88vCE5LGM_DC9",[["Shreyas Nair","9834186315",2.0,"MPSTME","MBA Tech"]]],["R175","2026-08-11T22:08:54.858","siyabagmar31@gmail.com",2,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=1dmJybYGoXry-R4zksGAn86PY7YdfuJEE",[["Disha","8435073231",2.0,"MPSTME","B.Tech"],["Vansh","7374832825",2.0,"MPSTME","B.Tech"]]],["R176","2026-08-11T22:09:09.564","agrawalpahal475@gmail.com",1,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=1saeJWPjOphHkvegWx0kgW0553vbS2lTg",[["Pahal Agrawal","6267948455",1.0,"MPSTME","B.Tech"]]],["R177","2026-08-11T22:11:21.405","guysoulful247@gmail.com",2,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=1DQC6FAvIdWFBWGqnl4TPsPpq9R1fBHaP",[["Neev Shah","8200183800",2.0,"MPSTME","B.Tech"],["Kanhaa Agrawal","8827079413",2.0,"MPSTME","MBA Tech"]]],["R178","2026-08-11T22:11:27.461","reneemlad@gmail.com",2,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=1H9mC5deIPLv-aTiHUlsUj4P-kXNgcTqN",[["Renee","9408957570",3.0,"MPSTME","B.Tech"],["Aastha","8141749927",3.0,"MPSTME","B.Tech"]]],["R179","2026-08-11T22:11:42.845","siyabagmar31@gmail.com",2,"Mirror Painting [Rs.119]","Mirror",119,"https://drive.google.com/open?id=1LVGaZSbsOUks3FiyY6dNgFFH_EQt7wqB",[["Bhavya jain","8000762303",2.0,"MPSTME","MBA Tech"],["Arihant Jain","7976163659",2.0,"MPSTME","B.Tech"]]],["R180","2026-08-11T22:12:03.906","jaindarshil58@gmail.com",2,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=1ij8KBxZJ9A8SCWyrxg8nnnCWqTnSVOVg",[["Lakshya Mundra","9685177357",2.0,"MPSTME","B.Tech"],["Neev Shah","8200183800",2.0,"MPSTME","B.Tech"]]],["R181","2026-08-11T22:12:52.312","rashikhodre@gmail.com",2,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=13QGEBooDOqv7hphSkaUvWs7hL3_KuBwa",[["Rashi Khodre","9644196493",3.0,"MPSTME","B.Tech"],["Samiksha Jain","7972721446",3.0,"MPSTME","B.Tech"]]],["R182","2026-08-11T22:12:59.943","aashiprachi029@gmail.com",2,"Mirror Painting [Rs.119]","Mirror",119,"https://drive.google.com/open?id=118sVePEy8yVds_UXm-3jhtXKhrQvF_ji",[["Mahak sharma","8890090307",3.0,"MPSTME","B.Tech"],["Vedakshi oswal","9136117116",3.0,"MPSTME","B.Tech"]]],["R183","2026-08-11T22:13:18.365","somyabaiwal8@gmail.com",2,"Mirror Painting [Rs.119]","Mirror",119,"https://drive.google.com/open?id=1GcSDINSab5ok1LFGv1_whJ0-arPFTdGa",[["Somya","6266589160",3.0,"MPSTME","B.Tech"],["Shikhar","9408099567",2.0,"MPSTME","B.Tech"]]],["R184","2026-08-11T22:14:13.915","mittal.naina211@gmail.com",1,"Mirror Painting [Rs.119]","Mirror",119,"https://drive.google.com/open?id=1jZS6G7LYLgCiGIWidYXRQ0VCVw0pqjIn",[["Naina Mittal","6268520486",3.0,"MPSTME","B.Tech"]]],["R185","2026-08-11T22:14:24.774","ridhimajoshi06@gmail.com",2,"Mirror Painting [Rs.119]","Mirror",119,"https://drive.google.com/open?id=1jOFZVQdOFYZcSrO7dLecpeCGL5b4vdEF",[["Ridhima Joshi","9662288875",2.0,"MPSTME","B.Tech"],["Ananya Singh","6352492305",2.0,"MPSTME","B.Tech"]]],["R186","2026-08-11T22:15:00.105","aashiprachi029@gmail.com",2,"Mirror Painting [Rs.119]","Mirror",119,"https://drive.google.com/open?id=1rmxi5rdDtvNOI6UBWdjvaAVc_dbJ569R",[["Vishaka khetan","7020388817",4.0,"MPSTME","B.Tech"],["Vedant kansal","9599167067",2.0,"MPSTME","B.Tech"]]],["R187","2026-08-11T22:17:44.559","soham698dolas@gmail.com",2,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=15_cbqCRDJ-2CIijFmC3axDZhEzO1XjcS",[["Akshit Singh","6207464530",1.0,"MPSTME","B.Tech"],["Aditya Talekar","9022956915",1.0,"MPSTME","B.Tech"]]],["R188","2026-08-11T22:18:07.117","maradiaaayush@gmail.com",1,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=1F4RY9A8PXct5t_gnnLMFQ8S-35wKJmaD",[["Aayush Maradia","9409450339",4.0,"MPSTME","B.Tech"]]],["R189","2026-08-11T22:18:16.334","anchal.ghiriya@gmail.com",1,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=1BaLjvVidBam_uU-Davozh3lnSugVOrII",[["Anchal Ghiriya","8484893195",2.0,"MPSTME","B.Tech"]]],["R190","2026-08-11T22:20:08.916","ekagrabansal05@gmail.com",1,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=1VSjIsrAYHjKtLDeppap3GP1ut20JIY1o",[["Priyansh Jaiswal","9425082865",3.0,"MPSTME","B.Tech"]]],["R191","2026-08-11T22:20:41.707","jaindarshil58@gmail.com",2,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=1l38iKQrVU86Ez_EF74Lhr2sSd961VaOo",[["Shukrit paul chowdhury","9594299873",2.0,"MPSTME","B.Tech"],["Shivam thakkar","7304363463",2.0,"SPTM","B.Pharm + MBA"]]],["R192","2026-08-11T22:20:53.062","divyampjajoo@gmail.com",2,"Canvas and Stand [Rs.99]","Canvas",99,"https://drive.google.com/open?id=1w3hufNl7pydnysLJK5tx1cgOBPCbtiIa",[["Divyam jajoo","9429973205",2.0,"MPSTME","B.Tech"],["Darshil ranka","9649119094",2.0,"MPSTME","B.Tech"]]],["R193","2026-08-11T22:21:26.154","faithfullyours.adi@gmail.com",2,"Mirror Painting [Rs.119]","Mirror",119,"https://drive.google.com/open?id=1_qZje571VNqjdBen1O-VJLqAp854Alcs",[["Aditya Chowdhury","9123020091",2.0,"MPSTME","B.Tech"],["Sonishka Gupta","9116933958",2.0,"MPSTME","B.Tech"]]],["R194","2026-08-11T22:22:24.568","ayushsatishsingh2020@gmail.com",2,"Mirror Painting [Rs.119]","Mirror",119,"https://drive.google.com/open?id=1OYo4ezWfSFKIOIzrF-iuT_7PlY9cfU-H",[["Ayush Singh","7021814006",2.0,"MPSTME","B.Tech"],["Minakshi Singh","7987016453",3.0,"SPTM","B.Pharm"]]],["R195","2026-08-11T22:22:37.893","archajain299@gmail.com",2,"Combo [Rs.199]","Combo",199,"https://drive.google.com/open?id=1zPYH2wvHBLSX9N3kiPjl1Z8hZXvOP9UW",[["Archa jain","9216169801",2.0,"MPSTME","B.Tech"],["Shravika jain","09284355031",2.0,"MPSTME","B.Tech"]]]];

// ---------- Parse raw data into structured registrations ----------
// ORIGINAL_REGISTRATIONS is the immutable source of truth from the uploaded Excel file.
// It is never mutated — on-the-spot walk-in registrations are kept in a completely
// separate array (see buildWalkInRegistration) and merged only at render time.
const ORIGINAL_REGISTRATIONS = RAW_DATA.map((row) => {
  const [id, timestamp, email, numParticipants, kitRaw, kitType, price, paymentProofLink, participants] = row;
  return {
    id,
    timestamp,
    email,
    numParticipants,
    kitRaw,
    kitType, // "Mirror" | "Canvas" | "Combo" | "Multiple-Flagged" | "Unknown"
    price,   // number or null
    paymentProofLink,
    isWalkIn: false,
    participants: participants.map((p) => ({
      name: (p[0] || "").trim(),
      phone: p[1] || "",
      year: p[2] || null,
      school: p[3] || "",
      programme: p[4] || "",
    })),
  };
});

// Flatten a list of registrations into individual participants, each carrying a
// reference back to their registration. Reused for the original data and for the
// merged (original + walk-in) data.
function flattenParticipants(registrations) {
  const out = [];
  registrations.forEach((reg) => {
    reg.participants.forEach((p, pIndex) => {
      out.push({
        key: `${reg.id}:${pIndex}`,
        regId: reg.id,
        pIndex,
        name: p.name,
        phone: p.phone,
        year: p.year,
        school: p.school,
        programme: p.programme,
        email: reg.email,
        kitType: reg.kitType,
        kitRaw: reg.kitRaw,
        price: reg.price,
        timestamp: reg.timestamp,
        numParticipants: reg.numParticipants,
        isWalkIn: !!reg.isWalkIn,
        teammates: reg.participants.filter((_, i) => i !== pIndex).map((t) => t.name).filter(Boolean),
      });
    });
  });
  return out;
}

const ORIGINAL_PARTICIPANTS = flattenParticipants(ORIGINAL_REGISTRATIONS);

const YEAR_LABELS = { 1: "1st Year", 2: "2nd Year", 3: "3rd Year", 4: "4th Year" };
const KIT_COLORS = {
  Mirror: "var(--mirror)",
  Canvas: "var(--clay)",
  Combo: "var(--marigold)",
  "Multiple-Flagged": "var(--danger)",
  Unknown: "var(--ink-soft)",
};
const KIT_LABELS = {
  Mirror: "Mirror Painting",
  Canvas: "Canvas & Stand",
  Combo: "Combo",
  "Multiple-Flagged": "Needs Review",
  Unknown: "Unknown",
};
const KIT_PRICES = { Mirror: 119, Canvas: 99, Combo: 199 };

let walkInCounter = 0;
function nextWalkInId() {
  walkInCounter += 1;
  return `W${String(walkInCounter).padStart(3, "0")}-${Date.now().toString(36).slice(-4)}`;
}

// Build a registration object (same shape as ORIGINAL_REGISTRATIONS entries) from the
// on-the-spot "Add Walk-in" form. This is the ONLY way walk-in data enters the app —
// it is stored separately in event-day state, never merged into ORIGINAL_REGISTRATIONS.
function buildWalkInRegistration(form) {
  const participants = [{
    name: (form.name || "").trim(),
    phone: (form.phone || "").trim(),
    year: form.year ? Number(form.year) : null,
    school: (form.school || "").trim(),
    programme: (form.programme || "").trim(),
  }];
  if (form.hasTeammate) {
    participants.push({
      name: (form.teammateName || "").trim(),
      phone: (form.teammatePhone || "").trim(),
      year: form.teammateYear ? Number(form.teammateYear) : null,
      school: (form.teammateSchool || "").trim(),
      programme: (form.teammateProgramme || "").trim(),
    });
  }
  return {
    id: form.id || nextWalkInId(),
    timestamp: form.timestamp || new Date().toISOString(),
    email: (form.email || "").trim().toLowerCase(),
    numParticipants: participants.length,
    kitRaw: KIT_LABELS[form.kitType] || form.kitType,
    kitType: form.kitType,
    price: KIT_PRICES[form.kitType] ?? null,
    paymentProofLink: null,
    isWalkIn: true,
    participants,
  };
}

function fmtMoney(n) {
  if (n === null || n === undefined || isNaN(n)) return "—";
  return "\u20B9" + Number(n).toLocaleString("en-IN");
}

function fmtTime(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  } catch (e) {
    return "—";
  }
}

function fmtDateTime(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch (e) {
    return "—";
  }
}

function cx(...args) {
  return args.filter(Boolean).join(" ");
}

function downloadCSV(filename, rows) {
  if (!rows || !rows.length) return;
  const headers = Object.keys(rows[0]);
  const esc = (v) => {
    if (v === null || v === undefined) return "";
    const s = String(v).replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ---------- Issue detection (computed from whatever registration/participant lists are passed in) ----------
function computeIssues(registrations, participants) {
  const issues = [];

  // Duplicate emails
  const byEmail = {};
  registrations.forEach((r) => {
    if (!r.email) return;
    (byEmail[r.email] = byEmail[r.email] || []).push(r);
  });
  Object.entries(byEmail).forEach(([email, regs]) => {
    if (regs.length > 1) {
      issues.push({
        id: `dup-email-${email}`,
        type: "Duplicate email",
        severity: "warn",
        message: `The email "${email}" was used in ${regs.length} separate registrations (${regs.map((r) => r.id).join(", ")}). This may be the same person registering more than once.`,
        regIds: regs.map((r) => r.id),
      });
    }
  });

  // Duplicate phone numbers across participants
  const byPhone = {};
  participants.forEach((p) => {
    if (!p.phone || p.phone.length !== 10) return;
    (byPhone[p.phone] = byPhone[p.phone] || []).push(p);
  });
  Object.entries(byPhone).forEach(([phone, ps]) => {
    const uniqueRegs = [...new Set(ps.map((p) => p.regId))];
    if (uniqueRegs.length > 1) {
      issues.push({
        id: `dup-phone-${phone}`,
        type: "Duplicate phone number",
        severity: "warn",
        message: `Phone number ${phone} appears across ${uniqueRegs.length} different registrations (${uniqueRegs.join(", ")}), used by: ${[...new Set(ps.map((p) => p.name))].join(", ")}.`,
        regIds: uniqueRegs,
      });
    } else if (ps.length > 1) {
      issues.push({
        id: `dup-phone-same-${phone}`,
        type: "Same phone, same registration",
        severity: "info",
        message: `Phone number ${phone} is listed for both teammates in registration ${uniqueRegs[0]}. Please confirm this wasn't a copy-paste error.`,
        regIds: uniqueRegs,
      });
    }
  });

  // Duplicate names (exact, case-insensitive) across different registrations
  const byName = {};
  participants.forEach((p) => {
    const n = (p.name || "").trim().toLowerCase();
    if (!n || n.length < 3) return;
    (byName[n] = byName[n] || []).push(p);
  });
  Object.entries(byName).forEach(([name, ps]) => {
    const uniqueRegs = [...new Set(ps.map((p) => p.regId))];
    if (uniqueRegs.length > 1) {
      const samePhone = new Set(ps.map((p) => p.phone)).size === 1;
      issues.push({
        id: `dup-name-${name}`,
        type: "Possible duplicate registration",
        severity: samePhone ? "warn" : "info",
        message: `"${ps[0].name}" appears in ${uniqueRegs.length} registrations (${uniqueRegs.join(", ")})${samePhone ? " with the same phone number" : ""}. ${samePhone ? "Likely a duplicate — please verify before double check-in." : "Could be a coincidental name match."}`,
        regIds: uniqueRegs,
      });
    }
  });

  // Multiple kit types selected on one registration (data entry error)
  registrations.forEach((r) => {
    if (r.kitType === "Multiple-Flagged") {
      issues.push({
        id: `multi-kit-${r.id}`,
        type: "Multiple kits selected",
        severity: "error",
        message: `Registration ${r.id} (${r.participants.map((p) => p.name).join(" & ")}) selected more than one kit option on the form: "${r.kitRaw}". Confirm with the participant which single kit they actually paid for.`,
        regIds: [r.id],
      });
    }
  });

  // Missing / malformed important fields
  participants.forEach((p) => {
    const problems = [];
    if (!p.name) problems.push("missing name");
    if (!p.phone || p.phone.length !== 10) problems.push(`phone number looks invalid ("${p.phone || "blank"}")`);
    if (problems.length) {
      issues.push({
        id: `missing-${p.key}`,
        type: "Incomplete registration",
        severity: "error",
        message: `${p.name || "Unnamed participant"} in registration ${p.regId}: ${problems.join(", ")}.`,
        regIds: [p.regId],
      });
    }
  });

  return issues;
}

// ---------- Event-day state (kept fully separate from source registration data) ----------
const STORAGE_KEY = "desikalakar:eventday:v1";
const EMPTY_STATE = { participants: {}, registrations: {} };

async function loadEventState() {
  try {
    const res = await window.storage.get(STORAGE_KEY, true);
    if (res && res.value) return JSON.parse(res.value);
    return { ...EMPTY_STATE };
  } catch (e) {
    return { ...EMPTY_STATE };
  }
}

async function saveEventState(state) {
  try {
    await window.storage.set(STORAGE_KEY, JSON.stringify(state), true);
    return true;
  } catch (e) {
    return false;
  }
}

// ---------- Design tokens & global styles ----------
function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700;800&display=swap');

      .dk-root {
        --canvas: #FAF6EF;
        --canvas-soft: #F1EADA;
        --paper: #FFFFFF;
        --ink: #221D18;
        --ink-soft: #8A7C6B;
        --line: #E6DDC9;
        --mirror: #2C6E68;
        --mirror-soft: #DCEEEA;
        --clay: #C1552F;
        --clay-soft: #F7E1D3;
        --marigold: #DD9A2E;
        --marigold-soft: #FBECD1;
        --violet: #5B3E8C;
        --violet-soft: #EBE3F6;
        --success: #3F8F5F;
        --success-soft: #E1F0E5;
        --danger: #C0392B;
        --danger-soft: #F8DEDA;
        font-family: 'Inter', -apple-system, system-ui, sans-serif;
        color: var(--ink);
        background: var(--canvas);
      }
      .dk-root * { box-sizing: border-box; }
      .dk-display { font-family: 'Fraunces', Georgia, serif; }
      .dk-tabular { font-variant-numeric: tabular-nums; }

      .dk-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
      .dk-scroll::-webkit-scrollbar-thumb { background: var(--line); border-radius: 8px; }
      .dk-scroll::-webkit-scrollbar-track { background: transparent; }

      .dk-card {
        background: var(--paper);
        border: 1px solid var(--line);
        border-radius: 18px;
      }
      .dk-btn {
        font-family: 'Inter', sans-serif;
        font-weight: 600;
        border-radius: 12px;
        transition: transform .08s ease, box-shadow .08s ease, background .12s ease;
        cursor: pointer;
        border: 1px solid transparent;
      }
      .dk-btn:active { transform: scale(0.97); }
      .dk-btn:disabled { cursor: not-allowed; opacity: 0.5; transform: none; }
      .dk-btn-primary { background: var(--ink); color: var(--canvas); }
      .dk-btn-primary:not(:disabled):hover { background: #3a3128; }
      .dk-btn-success { background: var(--success); color: white; }
      .dk-btn-success:not(:disabled):hover { box-shadow: 0 4px 14px rgba(63,143,95,.35); }
      .dk-btn-marigold { background: var(--marigold); color: white; }
      .dk-btn-marigold:not(:disabled):hover { box-shadow: 0 4px 14px rgba(221,154,46,.35); }
      .dk-btn-danger { background: var(--danger-soft); color: var(--danger); }
      .dk-btn-danger:not(:disabled):hover { background: #f3c9c2; }
      .dk-btn-outline { background: var(--paper); color: var(--ink); border-color: var(--line); }
      .dk-btn-outline:not(:disabled):hover { border-color: var(--ink-soft); }

      .dk-badge {
        display: inline-flex; align-items: center; gap: 5px;
        font-size: 12px; font-weight: 700; letter-spacing: .01em;
        padding: 4px 10px; border-radius: 999px; white-space: nowrap;
      }

      .dk-input {
        border: 1.5px solid var(--line);
        border-radius: 12px;
        background: var(--paper);
        padding: 10px 14px;
        font-family: 'Inter', sans-serif;
        outline: none;
        transition: border-color .12s ease;
      }
      .dk-input:focus { border-color: var(--ink); }

      .dk-nav-item {
        display: flex; align-items: center; gap: 12px;
        padding: 11px 14px; border-radius: 12px;
        color: var(--canvas-soft); font-weight: 600; font-size: 14.5px;
        cursor: pointer; transition: background .12s ease, color .12s ease;
      }
      .dk-nav-item:hover { background: rgba(255,255,255,0.08); color: #fff; }
      .dk-nav-item.active { background: var(--marigold); color: #2a1c05; }

      .dk-stat-card {
        position: relative; overflow: hidden;
      }

      @keyframes dk-fade-in { from { opacity: 0; transform: translateY(4px);} to { opacity: 1; transform: translateY(0);} }
      .dk-fade-in { animation: dk-fade-in .18s ease; }

      @media (max-width: 900px) {
        .dk-sidebar { display: none !important; }
        .dk-mobile-nav { display: flex !important; }
      }
    `}</style>
  );
}

function BrushDivider({ color = "var(--clay)", width = 120 }) {
  return (
    <svg width={width} height="10" viewBox="0 0 120 10" fill="none" style={{ display: "block", marginTop: 4, marginBottom: 2 }}>
      <path d="M2 6.5C18 2.5 34 8.5 50 5.5C66 2.5 82 8 98 4.5C104 3.3 112 5 118 3.5"
        stroke={color} strokeWidth="3.2" strokeLinecap="round" fill="none" opacity="0.85" />
    </svg>
  );
}

// ---------- Small reusable UI atoms ----------
function Badge({ tone = "ink", children, icon: Icon }) {
  const tones = {
    ink: { bg: "var(--canvas-soft)", fg: "var(--ink)" },
    success: { bg: "var(--success-soft)", fg: "var(--success)" },
    danger: { bg: "var(--danger-soft)", fg: "var(--danger)" },
    warn: { bg: "var(--marigold-soft)", fg: "#8a5a0f" },
    mirror: { bg: "var(--mirror-soft)", fg: "var(--mirror)" },
    clay: { bg: "var(--clay-soft)", fg: "var(--clay)" },
    violet: { bg: "var(--violet-soft)", fg: "var(--violet)" },
  };
  const t = tones[tone] || tones.ink;
  return (
    <span className="dk-badge" style={{ background: t.bg, color: t.fg }}>
      {Icon ? <Icon size={12} strokeWidth={2.75} /> : null}
      {children}
    </span>
  );
}

function StatCard({ label, value, sub, icon: Icon, accent = "var(--ink)", accentSoft = "var(--canvas-soft)" }) {
  return (
    <div className="dk-card dk-stat-card" style={{ padding: "16px 18px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ color: "var(--ink-soft)", fontSize: 12.5, fontWeight: 700, letterSpacing: ".02em", textTransform: "uppercase" }}>
          {label}
        </div>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: accentSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={16} color={accent} strokeWidth={2.3} />
        </div>
      </div>
      <div className="dk-display dk-tabular" style={{ fontSize: 30, fontWeight: 600, marginTop: 8, lineHeight: 1 }}>
        {value}
      </div>
      {sub ? <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 6 }}>{sub}</div> : null}
    </div>
  );
}

function SectionTitle({ eyebrow, title, color = "var(--clay)" }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {eyebrow ? (
        <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--ink-soft)" }}>
          {eyebrow}
        </div>
      ) : null}
      <h2 className="dk-display" style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>{title}</h2>
      <BrushDivider color={color} />
    </div>
  );
}

function Donut({ segments, size = 132, thickness = 20 }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let acc = 0;
  const stops = segments.map((s) => {
    const start = (acc / total) * 360;
    acc += s.value;
    const end = (acc / total) * 360;
    return `${s.color} ${start}deg ${end}deg`;
  });
  const bg = stops.length ? `conic-gradient(${stops.join(",")})` : "var(--canvas-soft)";
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <div style={{ width: size, height: size, borderRadius: "50%", background: bg }} />
      <div style={{
        position: "absolute", inset: thickness, borderRadius: "50%", background: "var(--paper)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}>
        <div className="dk-display dk-tabular" style={{ fontSize: 22, fontWeight: 600 }}>{total}</div>
        <div style={{ fontSize: 10.5, color: "var(--ink-soft)", fontWeight: 600 }}>total</div>
      </div>
    </div>
  );
}

function Modal({ open, onClose, children, width = 440 }) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(34,29,24,0.45)", zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="dk-card dk-fade-in dk-scroll"
        style={{ width, maxWidth: "100%", maxHeight: "88vh", overflowY: "auto", padding: 22, position: "relative" }}
      >
        <button
          onClick={onClose}
          className="dk-btn"
          style={{ position: "absolute", top: 14, right: 14, width: 30, height: 30, background: "var(--canvas-soft)", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <X size={16} />
        </button>
        {children}
      </div>
    </div>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  const tones = {
    success: { bg: "var(--success)", Icon: CheckCircle2 },
    danger: { bg: "var(--danger)", Icon: AlertCircle },
    info: { bg: "var(--ink)", Icon: Sparkles },
  };
  const t = tones[toast.tone] || tones.info;
  return (
    <div className="dk-fade-in" style={{
      position: "fixed", bottom: 22, left: "50%", transform: "translateX(-50%)", zIndex: 200,
      background: t.bg, color: "#fff", padding: "12px 20px", borderRadius: 14,
      display: "flex", alignItems: "center", gap: 10, fontWeight: 600, fontSize: 14,
      boxShadow: "0 10px 30px rgba(0,0,0,.25)", maxWidth: "90vw",
    }}>
      <t.Icon size={17} />
      {toast.message}
    </div>
  );
}


// ---------- Data context: exposes the merged (original + walk-in) registrations/participants ----------
const DataContext = createContext({ REGS: ORIGINAL_REGISTRATIONS, PARTS: ORIGINAL_PARTICIPANTS });
function useData() {
  return useContext(DataContext);
}

// ---------- Navigation ----------
const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "participants", label: "Participants", icon: Users },
  { id: "checkin", label: "Check-In", icon: Ticket },
  { id: "kits", label: "Kit Manager", icon: Palette },
  { id: "payments", label: "Payments", icon: Wallet },
  { id: "issues", label: "Issues", icon: AlertTriangle },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

function Sidebar({ page, setPage, issueCount, syncOk }) {
  return (
    <div className="dk-sidebar" style={{
      width: 232, flexShrink: 0, background: "var(--ink)", minHeight: "100vh",
      padding: "22px 14px", display: "flex", flexDirection: "column", gap: 4,
    }}>
      <div style={{ padding: "4px 10px 20px" }}>
        <div style={{ color: "var(--marigold)", fontSize: 11, fontWeight: 800, letterSpacing: ".14em" }}>ATRANGI PRESENTS</div>
        <div className="dk-display" style={{ color: "#fff", fontSize: 23, fontWeight: 600, lineHeight: 1.15, marginTop: 2 }}>Desi Kalakar</div>
        <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 11.5, marginTop: 3 }}>Event Control Room</div>
      </div>
      {NAV_ITEMS.map((item) => (
        <div key={item.id} className={cx("dk-nav-item", page === item.id && "active")} onClick={() => setPage(item.id)}>
          <item.icon size={17} strokeWidth={2.3} />
          {item.label}
          {item.id === "issues" && issueCount > 0 ? (
            <span style={{
              marginLeft: "auto", background: page === item.id ? "rgba(0,0,0,.2)" : "var(--danger)",
              color: "#fff", fontSize: 11, fontWeight: 800, borderRadius: 999, padding: "1px 7px",
            }}>{issueCount}</span>
          ) : null}
        </div>
      ))}
      <div style={{ marginTop: "auto", padding: "10px", display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.4)", fontSize: 11.5 }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: syncOk ? "#5FD498" : "#E0A32E" }} />
        {syncOk ? "Synced" : "Local only"}
      </div>
    </div>
  );
}

function MobileNav({ page, setPage }) {
  return (
    <div className="dk-mobile-nav" style={{
      display: "none", position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 90,
      background: "var(--ink)", padding: "6px 4px", justifyContent: "space-around",
      boxShadow: "0 -4px 16px rgba(0,0,0,.2)", overflowX: "auto",
    }}>
      {NAV_ITEMS.map((item) => (
        <div key={item.id} onClick={() => setPage(item.id)} style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
          padding: "6px 8px", color: page === item.id ? "var(--marigold)" : "rgba(255,255,255,0.55)",
          fontSize: 9.5, fontWeight: 700, flexShrink: 0,
        }}>
          <item.icon size={18} />
          {item.label}
        </div>
      ))}
    </div>
  );
}

// ---------- Event-state read helpers ----------
function getParticipantState(state, key) {
  return (state.participants && state.participants[key]) || {};
}
function getRegState(state, regId) {
  return (state.registrations && state.registrations[regId]) || {};
}
function isCheckedIn(state, key) {
  return !!getParticipantState(state, key).checkedIn;
}
function isKitGiven(state, regId) {
  return !!getRegState(state, regId).kitGiven;
}
function getPaymentStatus(state, regId) {
  return getRegState(state, regId).paymentStatus || "pending"; // pending | verified | issue
}
function getManualIssue(state, regId) {
  return getRegState(state, regId).manualIssue || null;
}

// ---------- Participant Profile ----------
function ProfileContent({ participant, state, onCheckIn, onKitGive, onPayment }) {
  if (!participant) return null;
  const checked = isCheckedIn(state, participant.key);
  const pState = getParticipantState(state, participant.key);
  const kitG = isKitGiven(state, participant.regId);
  const regState = getRegState(state, participant.regId);
  const payStatus = getPaymentStatus(state, participant.regId);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
        <div style={{
          width: 46, height: 46, borderRadius: 14, background: "var(--marigold-soft)", color: "#8a5a0f",
          display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 17, flexShrink: 0,
        }} className="dk-display">
          {(participant.name || "?").trim().charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="dk-display" style={{ fontSize: 19, fontWeight: 600 }}>{participant.name || "Unnamed"}</div>
          <div style={{ fontSize: 12.5, color: "var(--ink-soft)", display: "flex", alignItems: "center", gap: 6 }}>
            Reg {participant.regId} · {participant.numParticipants === 2 ? "Team of 2" : "Solo"}
            {participant.isWalkIn ? <Badge tone="violet" icon={UserPlus}>Walk-in</Badge> : null}
          </div>
        </div>
      </div>

      {participant.teammates.length ? (
        <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 6 }}>
          Registered with <b style={{ color: "var(--ink)" }}>{participant.teammates.join(", ")}</b>
        </div>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 16 }}>
        <InfoRow icon={Phone} label="Phone" value={participant.phone || "—"} />
        <InfoRow icon={Mail} label="Email" value={participant.email || "—"} small />
        <InfoRow icon={GraduationCap} label="Year" value={participant.year ? (YEAR_LABELS[participant.year] || participant.year) : "—"} />
        <InfoRow icon={Package} label="Kit" value={KIT_LABELS[participant.kitType] || participant.kitType} />
      </div>

      <div className="dk-card" style={{ marginTop: 16, padding: 14, background: "var(--canvas-soft)", border: "none" }}>
        <StatusLine label="Registration" ok icon={CheckCircle2} text="Registered" />
        <StatusLine
          label="Payment"
          ok={payStatus === "verified"}
          bad={payStatus === "issue"}
          icon={payStatus === "verified" ? ShieldCheck : payStatus === "issue" ? ShieldAlert : ShieldQuestion}
          text={payStatus === "verified" ? "Verified" : payStatus === "issue" ? "Issue flagged" : "Not yet verified"}
        />
        <StatusLine
          label="Attendance"
          ok={checked}
          icon={checked ? CheckCircle2 : Clock}
          text={checked ? `Checked in — ${fmtTime(pState.checkedInAt)}` : "Not checked in"}
        />
        <StatusLine
          label="Kit"
          ok={kitG}
          icon={kitG ? CheckCircle2 : Clock}
          text={kitG ? `Distributed — ${fmtTime(regState.kitGivenAt)}` : "Not distributed"}
          last
        />
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
        <button className={cx("dk-btn", checked ? "dk-btn-outline" : "dk-btn-success")} style={{ flex: 1, padding: "11px 10px", fontSize: 13.5 }}
          onClick={() => onCheckIn(participant)}>
          {checked ? "✓ Checked In" : "✅ Check In"}
        </button>
        <button className={cx("dk-btn", kitG ? "dk-btn-outline" : "dk-btn-marigold")} style={{ flex: 1, padding: "11px 10px", fontSize: 13.5 }}
          onClick={() => onKitGive(participant)}>
          {kitG ? "✓ Kit Given" : "🎨 Give Kit"}
        </button>
      </div>
      {participant.price !== null ? (
        <button
          className="dk-btn dk-btn-outline"
          style={{ width: "100%", marginTop: 8, padding: "10px", fontSize: 13 }}
          onClick={() => onPayment(participant, payStatus === "verified" ? "pending" : "verified")}
        >
          {payStatus === "verified" ? "Mark payment as unverified" : `Verify payment · ${fmtMoney(participant.price)}`}
        </button>
      ) : null}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, small }) {
  return (
    <div>
      <div style={{ fontSize: 10.5, color: "var(--ink-soft)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".03em", display: "flex", alignItems: "center", gap: 4 }}>
        <Icon size={11} /> {label}
      </div>
      <div style={{ fontSize: small ? 12.5 : 14, fontWeight: 600, marginTop: 2, wordBreak: "break-word" }}>{value}</div>
    </div>
  );
}

function StatusLine({ label, ok, bad, icon: Icon, text, last }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 0", borderBottom: last ? "none" : "1px solid var(--line)" }}>
      <span style={{ fontSize: 12.5, color: "var(--ink-soft)", fontWeight: 600 }}>{label}</span>
      <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 700, color: bad ? "var(--danger)" : ok ? "var(--success)" : "var(--ink-soft)" }}>
        <Icon size={13.5} /> {text}
      </span>
    </div>
  );
}

// ---------- Dashboard page ----------
function DashboardPage({ stats, state, setPage, openProfile, openAddWalkIn }) {
  return (
    <div className="dk-fade-in">
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <SectionTitle eyebrow="Live overview" title="Event Dashboard" />
        <button className="dk-btn dk-btn-marigold" style={{ padding: "10px 16px", fontSize: 13, display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }} onClick={() => openAddWalkIn()}>
          <UserPlus size={15} /> Add Walk-in
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12 }}>
        <StatCard label="Total Registrations" value={stats.totalRegs} sub={stats.walkInCount ? `${stats.originalCount} pre-registered + ${stats.walkInCount} walk-in` : `${stats.totalParticipants} participants`} icon={Users} accent="var(--violet)" accentSoft="var(--violet-soft)" />
        <StatCard label="Total Participants" value={stats.totalParticipants} sub={`${stats.soloCount} solo · ${stats.teamCount} teams`} icon={Users} accent="var(--ink)" accentSoft="var(--canvas-soft)" />
        <StatCard label="Mirror Painting" value={stats.byKit.Mirror} sub="registrations" icon={Palette} accent="var(--mirror)" accentSoft="var(--mirror-soft)" />
        <StatCard label="Canvas Painting" value={stats.byKit.Canvas} sub="registrations" icon={Palette} accent="var(--clay)" accentSoft="var(--clay-soft)" />
        <StatCard label="Combo Kits" value={stats.byKit.Combo} sub="registrations" icon={Palette} accent="var(--marigold)" accentSoft="var(--marigold-soft)" />
        <StatCard label="Pending Verification" value={stats.needsReview} sub="flagged kit selections" icon={AlertTriangle} accent="var(--danger)" accentSoft="var(--danger-soft)" />
        <StatCard label="Checked In" value={stats.checkedInCount} sub={`of ${stats.totalParticipants} participants`} icon={CheckCircle2} accent="var(--success)" accentSoft="var(--success-soft)" />
        <StatCard label="Kits Distributed" value={stats.kitsGivenCount} sub={`of ${stats.kitsRequired} kits`} icon={Package} accent="var(--marigold)" accentSoft="var(--marigold-soft)" />
        <StatCard label="Kits Remaining" value={stats.kitsRequired - stats.kitsGivenCount} sub="left to distribute" icon={Package} accent="var(--ink)" accentSoft="var(--canvas-soft)" />
        <StatCard label="Expected Revenue" value={fmtMoney(stats.expectedRevenue)} sub="from valid registrations" icon={Wallet} accent="var(--violet)" accentSoft="var(--violet-soft)" />
        <StatCard label="Collected" value={fmtMoney(stats.collectedRevenue)} sub={`${stats.verifiedCount} payments verified`} icon={Wallet} accent="var(--success)" accentSoft="var(--success-soft)" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 14, marginTop: 22 }} className="dk-grid-2">
        <div className="dk-card" style={{ padding: 20 }}>
          <SectionTitle eyebrow="Kit split" title="Participation Breakdown" color="var(--mirror)" />
          <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
            <Donut segments={[
              { label: "Mirror", value: stats.byKit.Mirror, color: "var(--mirror)" },
              { label: "Canvas", value: stats.byKit.Canvas, color: "var(--clay)" },
              { label: "Combo", value: stats.byKit.Combo, color: "var(--marigold)" },
              { label: "Needs review", value: stats.needsReview, color: "var(--danger)" },
            ]} />
            <div style={{ display: "flex", flexDirection: "column", gap: 9, flex: 1, minWidth: 160 }}>
              {[
                ["Mirror", stats.byKit.Mirror, "var(--mirror)"],
                ["Canvas", stats.byKit.Canvas, "var(--clay)"],
                ["Combo", stats.byKit.Combo, "var(--marigold)"],
                ["Needs review", stats.needsReview, "var(--danger)"],
              ].map(([label, val, color]) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontWeight: 600 }}>{label}</span>
                  <span className="dk-tabular" style={{ color: "var(--ink-soft)", fontWeight: 700 }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="dk-card" style={{ padding: 20 }}>
          <SectionTitle eyebrow="Funnel" title="Registration Status" color="var(--violet)" />
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              ["Registered", stats.totalParticipants, "var(--ink)"],
              ["Checked In", stats.checkedInCount, "var(--success)"],
              ["Kit Given", stats.kitsGivenParticipants, "var(--marigold)"],
              ["Pending Check-In", stats.totalParticipants - stats.checkedInCount, "var(--ink-soft)"],
            ].map(([label, val, color]) => {
              const pct = stats.totalParticipants ? Math.round((val / stats.totalParticipants) * 100) : 0;
              return (
                <div key={label}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>{label}</span>
                    <span className="dk-tabular" style={{ color: "var(--ink-soft)" }}>{val} · {pct}%</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 999, background: "var(--canvas-soft)", overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 999, transition: "width .3s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="dk-card" style={{ padding: 20, marginTop: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <SectionTitle eyebrow="What's happening now" title="Live Activity" color="var(--marigold)" />
          <button className="dk-btn dk-btn-outline" style={{ padding: "8px 14px", fontSize: 12.5, marginBottom: 14 }} onClick={() => setPage("checkin")}>
            Go to Check-In <ChevronRight size={13} style={{ display: "inline", verticalAlign: -2 }} />
          </button>
        </div>
        {stats.activity.length === 0 ? (
          <div style={{ color: "var(--ink-soft)", fontSize: 13.5, padding: "10px 0" }}>
            No check-ins or kit distributions yet. Once the desk opens, activity will show up here in real time.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {stats.activity.slice(0, 10).map((a, i) => (
              <div key={i} onClick={() => openProfile(a.participant)} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "9px 4px",
                borderBottom: i === Math.min(9, stats.activity.length - 1) ? "none" : "1px solid var(--line)",
                cursor: "pointer",
              }}>
                <span style={{ fontSize: 16 }}>{a.icon}</span>
                <span style={{ fontSize: 13.5, flex: 1 }}>
                  <b>{a.name}</b> {a.text}
                </span>
                <span className="dk-tabular" style={{ fontSize: 12, color: "var(--ink-soft)", fontWeight: 600 }}>{fmtTime(a.time)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Participants page ----------
function ParticipantsPage({ state, openProfile, openAddWalkIn }) {
  const { PARTS } = useData();
  const [q, setQ] = useState("");
  const [kitFilter, setKitFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [attFilter, setAttFilter] = useState("all");
  const [kitStatusFilter, setKitStatusFilter] = useState("all");
  const [payFilter, setPayFilter] = useState("all");

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return PARTS.filter((p) => {
      if (qq) {
        const hay = `${p.name} ${p.phone} ${p.email}`.toLowerCase();
        if (!hay.includes(qq)) return false;
      }
      if (kitFilter !== "all" && p.kitType !== kitFilter) return false;
      if (yearFilter !== "all" && String(p.year) !== yearFilter) return false;
      const checked = isCheckedIn(state, p.key);
      if (attFilter === "in" && !checked) return false;
      if (attFilter === "out" && checked) return false;
      const kitG = isKitGiven(state, p.regId);
      if (kitStatusFilter === "given" && !kitG) return false;
      if (kitStatusFilter === "pending" && kitG) return false;
      const pay = getPaymentStatus(state, p.regId);
      if (payFilter !== "all" && pay !== payFilter) return false;
      return true;
    });
  }, [q, kitFilter, yearFilter, attFilter, kitStatusFilter, payFilter, state, PARTS]);

  return (
    <div className="dk-fade-in">
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <SectionTitle eyebrow={`${filtered.length} of ${PARTS.length} shown`} title="Participants" color="var(--mirror)" />
        <button className="dk-btn dk-btn-marigold" style={{ padding: "10px 16px", fontSize: 13, display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }} onClick={() => openAddWalkIn()}>
          <UserPlus size={15} /> Add Walk-in
        </button>
      </div>

      <div className="dk-card" style={{ padding: 14, marginBottom: 14 }}>
        <div style={{ position: "relative", marginBottom: 10 }}>
          <Search size={16} style={{ position: "absolute", left: 12, top: 12, color: "var(--ink-soft)" }} />
          <input className="dk-input" style={{ width: "100%", paddingLeft: 36 }} placeholder="Search by name, phone, or email…"
            value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <FilterSelect label="Kit" value={kitFilter} onChange={setKitFilter} options={[["all", "All kits"], ["Mirror", "Mirror"], ["Canvas", "Canvas"], ["Combo", "Combo"], ["Multiple-Flagged", "Needs review"]]} />
          <FilterSelect label="Year" value={yearFilter} onChange={setYearFilter} options={[["all", "All years"], ["1", "1st Year"], ["2", "2nd Year"], ["3", "3rd Year"], ["4", "4th Year"]]} />
          <FilterSelect label="Attendance" value={attFilter} onChange={setAttFilter} options={[["all", "All"], ["in", "Checked in"], ["out", "Not checked in"]]} />
          <FilterSelect label="Kit status" value={kitStatusFilter} onChange={setKitStatusFilter} options={[["all", "All"], ["given", "Kit given"], ["pending", "Kit pending"]]} />
          <FilterSelect label="Payment" value={payFilter} onChange={setPayFilter} options={[["all", "All"], ["verified", "Verified"], ["pending", "Pending"], ["issue", "Issue"]]} />
        </div>
      </div>

      <div className="dk-card dk-scroll" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5, minWidth: 820 }}>
          <thead>
            <tr style={{ borderBottom: "1.5px solid var(--line)" }}>
              {["Name", "Phone", "Year", "Kit", "Attendance", "Kit Status", "Payment"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, textTransform: "uppercase", letterSpacing: ".03em", color: "var(--ink-soft)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 400).map((p) => {
              const checked = isCheckedIn(state, p.key);
              const kitG = isKitGiven(state, p.regId);
              const pay = getPaymentStatus(state, p.regId);
              return (
                <tr key={p.key} onClick={() => openProfile(p)} style={{ borderBottom: "1px solid var(--line)", cursor: "pointer" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--canvas-soft)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "9px 12px", fontWeight: 600 }}>
                    {p.name || <span style={{ color: "var(--danger)" }}>Unnamed</span>}
                    {p.isWalkIn ? <span style={{ marginLeft: 6, fontSize: 10.5, fontWeight: 800, color: "var(--violet)" }}>WALK-IN</span> : null}
                  </td>
                  <td style={{ padding: "9px 12px", color: "var(--ink-soft)" }} className="dk-tabular">{p.phone || "—"}</td>
                  <td style={{ padding: "9px 12px" }}>{p.year ? YEAR_LABELS[p.year] || p.year : "—"}</td>
                  <td style={{ padding: "9px 12px" }}><Badge tone={p.kitType === "Multiple-Flagged" ? "danger" : p.kitType === "Mirror" ? "mirror" : p.kitType === "Canvas" ? "clay" : "warn"}>{KIT_LABELS[p.kitType]}</Badge></td>
                  <td style={{ padding: "9px 12px" }}>{checked ? <Badge tone="success" icon={CheckCircle2}>In</Badge> : <Badge tone="ink" icon={Clock}>Waiting</Badge>}</td>
                  <td style={{ padding: "9px 12px" }}>{kitG ? <Badge tone="warn" icon={CheckCircle2}>Given</Badge> : <Badge tone="ink" icon={Clock}>Pending</Badge>}</td>
                  <td style={{ padding: "9px 12px" }}>
                    {pay === "verified" ? <Badge tone="success" icon={ShieldCheck}>Verified</Badge> : pay === "issue" ? <Badge tone="danger" icon={ShieldAlert}>Issue</Badge> : <Badge tone="ink" icon={ShieldQuestion}>Pending</Badge>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 ? <div style={{ padding: 30, textAlign: "center", color: "var(--ink-soft)" }}>No participants match these filters.</div> : null}
      </div>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <select className="dk-input" value={value} onChange={(e) => onChange(e.target.value)} style={{ fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
      {options.map(([v, l]) => <option key={v} value={v}>{label}: {l}</option>)}
    </select>
  );
}

// ---------- Check-In page ----------
function CheckInPage({ state, onCheckIn, onKitGive, onIssue, showToast, openAddWalkIn }) {
  const { PARTS } = useData();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);
  const inputRef = useRef(null);

  const results = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (qq.length < 2) return [];
    return PARTS.filter((p) => `${p.name} ${p.phone} ${p.email}`.toLowerCase().includes(qq)).slice(0, 8);
  }, [q, PARTS]);

  const pick = (p) => {
    setSelected(p);
    setQ("");
  };

  const doCheckIn = (p) => {
    if (isCheckedIn(state, p.key)) { showToast("Already checked in.", "info"); return; }
    onCheckIn(p);
    showToast(`${p.name} checked in ✓`, "success");
  };
  const doKit = (p) => {
    if (isKitGiven(state, p.regId)) { showToast("Kit already given for this registration — duplicate blocked.", "danger"); return; }
    onKitGive(p);
    showToast(`Kit marked as given for ${p.name}'s registration`, "success");
  };
  const doIssue = (p) => {
    const note = window.prompt(`Describe the issue for ${p.name} (registration ${p.regId}):`);
    if (note === null) return;
    onIssue(p, note || "Flagged at check-in desk");
    showToast("Issue recorded.", "danger");
  };

  return (
    <div className="dk-fade-in">
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <SectionTitle eyebrow="Registration desk" title="Check-In Mode" color="var(--success)" />
        <button className="dk-btn dk-btn-marigold" style={{ padding: "10px 16px", fontSize: 13, display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }} onClick={() => openAddWalkIn()}>
          <UserPlus size={15} /> Add Walk-in
        </button>
      </div>

      {!selected ? (
        <div className="dk-card" style={{ padding: 20 }}>
          <div style={{ position: "relative" }}>
            <Search size={20} style={{ position: "absolute", left: 16, top: 16 }} />
            <input
              ref={inputRef} autoFocus
              className="dk-input"
              style={{ width: "100%", paddingLeft: 44, fontSize: 18, padding: "14px 14px 14px 44px" }}
              placeholder="Search name, phone, or email…"
              value={q} onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div style={{ marginTop: 14 }}>
            {q.trim().length >= 2 && results.length === 0 ? (
              <div style={{ color: "var(--ink-soft)", padding: "16px 4px" }}>
                No matching participant found. Double-check spelling or try their phone number.
                <div style={{ marginTop: 10 }}>
                  <button className="dk-btn dk-btn-outline" style={{ padding: "9px 14px", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }} onClick={() => openAddWalkIn(q.trim())}>
                    <Plus size={14} /> Register "{q.trim()}" as a walk-in
                  </button>
                </div>
              </div>
            ) : null}
            {results.map((p) => {
              const checked = isCheckedIn(state, p.key);
              return (
                <div key={p.key} onClick={() => pick(p)} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 10px",
                  borderBottom: "1px solid var(--line)", cursor: "pointer", borderRadius: 10,
                }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--canvas-soft)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  <div style={{ width: 38, height: 38, borderRadius: 11, background: "var(--marigold-soft)", color: "#8a5a0f", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }} className="dk-display">
                    {(p.name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name || "Unnamed"} {p.isWalkIn ? <span style={{ fontSize: 10, fontWeight: 800, color: "var(--violet)" }}>WALK-IN</span> : null}</div>
                    <div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>{p.phone} · {KIT_LABELS[p.kitType]}</div>
                  </div>
                  {checked ? <Badge tone="success" icon={CheckCircle2}>Checked in</Badge> : null}
                  <ChevronRight size={18} color="var(--ink-soft)" />
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <CheckInCard participant={selected} state={state} onBack={() => setSelected(null)}
          onCheckIn={doCheckIn} onKitGive={doKit} onIssue={doIssue} />
      )}
    </div>
  );
}

function CheckInCard({ participant, state, onBack, onCheckIn, onKitGive, onIssue }) {
  const p = participant;
  const checked = isCheckedIn(state, p.key);
  const pState = getParticipantState(state, p.key);
  const kitG = isKitGiven(state, p.regId);
  const pay = getPaymentStatus(state, p.regId);

  return (
    <div className="dk-card dk-fade-in" style={{ padding: 24 }}>
      <button className="dk-btn dk-btn-outline" style={{ padding: "7px 12px", fontSize: 12.5, marginBottom: 16 }} onClick={onBack}>
        <ArrowLeft size={13} style={{ display: "inline", verticalAlign: -2, marginRight: 4 }} /> New search
      </button>

      {checked ? (
        <div style={{ background: "var(--success-soft)", color: "var(--success)", padding: "10px 14px", borderRadius: 12, fontWeight: 800, fontSize: 14, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <CheckCircle2 size={18} /> CHECKED IN ✓ — {fmtTime(pState.checkedInAt)}
        </div>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px,1fr))", gap: 14, marginBottom: 18 }}>
        <BigField label="Name" value={p.name || "Unnamed"} />
        <BigField label="Kit Type" value={KIT_LABELS[p.kitType]} />
        <BigField label="Year" value={p.year ? (YEAR_LABELS[p.year] || p.year) : "—"} />
        <BigField label="Phone" value={p.phone || "—"} />
        <BigField label="Payment" value={pay === "verified" ? "Verified" : pay === "issue" ? "Issue" : "Pending"} tone={pay === "verified" ? "success" : pay === "issue" ? "danger" : "warn"} />
      </div>

      {p.teammates.length ? (
        <div style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 16 }}>
          Registered with <b style={{ color: "var(--ink)" }}>{p.teammates.join(", ")}</b> — one kit is issued per registration.
        </div>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <button className={cx("dk-btn", checked ? "dk-btn-outline" : "dk-btn-success")} style={{ padding: "18px 8px", fontSize: 15 }} onClick={() => onCheckIn(p)}>
          ✅ CHECK IN
        </button>
        <button className={cx("dk-btn", kitG ? "dk-btn-outline" : "dk-btn-marigold")} style={{ padding: "18px 8px", fontSize: 15 }} onClick={() => onKitGive(p)}>
          🎨 KIT GIVEN
        </button>
        <button className="dk-btn dk-btn-danger" style={{ padding: "18px 8px", fontSize: 15 }} onClick={() => onIssue(p)}>
          ❌ MARK ISSUE
        </button>
      </div>
    </div>
  );
}

function BigField({ label, value, tone }) {
  const tones = { success: "var(--success)", danger: "var(--danger)", warn: "#8a5a0f" };
  return (
    <div>
      <div style={{ fontSize: 10.5, color: "var(--ink-soft)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".03em" }}>{label}</div>
      <div className="dk-display" style={{ fontSize: 19, fontWeight: 600, marginTop: 2, color: tone ? tones[tone] : "var(--ink)" }}>{value}</div>
    </div>
  );
}

// ---------- Kit Manager page ----------
function KitManagerPage({ stats, state, onKitGive, showToast }) {
  const { PARTS } = useData();
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (qq.length < 2) return [];
    return PARTS.filter((p) => `${p.name} ${p.phone} ${p.email}`.toLowerCase().includes(qq)).slice(0, 6);
  }, [q, PARTS]);

  const cards = [
    { key: "Mirror", label: "Mirror Painting", color: "var(--mirror)", soft: "var(--mirror-soft)" },
    { key: "Canvas", label: "Canvas & Stand", color: "var(--clay)", soft: "var(--clay-soft)" },
    { key: "Combo", label: "Combo", color: "var(--marigold)", soft: "var(--marigold-soft)" },
  ];

  return (
    <div className="dk-fade-in">
      <SectionTitle eyebrow="One kit per registration (team)" title="Kit Manager" color="var(--marigold)" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: 14, marginBottom: 18 }}>
        {cards.map((c) => {
          const required = stats.byKit[c.key];
          const distributed = stats.kitGivenByType[c.key] || 0;
          const remaining = required - distributed;
          const pct = required ? Math.round((distributed / required) * 100) : 0;
          return (
            <div key={c.key} className="dk-card" style={{ padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: c.color }} />
                <div className="dk-display" style={{ fontWeight: 600, fontSize: 17 }}>{c.label}</div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}>
                <Stat label="Required" val={required} />
                <Stat label="Distributed" val={distributed} />
                <Stat label="Remaining" val={remaining} />
              </div>
              <div style={{ height: 9, borderRadius: 999, background: c.soft, overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: c.color, transition: "width .3s ease" }} />
              </div>
            </div>
          );
        })}
      </div>

      {stats.needsReview > 0 ? (
        <div className="dk-card" style={{ padding: "14px 18px", marginBottom: 18, background: "var(--danger-soft)", border: "none", display: "flex", alignItems: "center", gap: 10 }}>
          <AlertTriangle size={18} color="var(--danger)" />
          <div style={{ fontSize: 13.5, color: "#7a2b20" }}>
            <b>{stats.needsReview}</b> registration(s) selected more than one kit type on the form and are excluded from required-kit counts until resolved. See Issues.
          </div>
        </div>
      ) : null}

      <div className="dk-card" style={{ padding: 18 }}>
        <SectionTitle eyebrow="Quick action" title="Give a Kit" color="var(--mirror)" />
        <div style={{ position: "relative" }}>
          <Search size={16} style={{ position: "absolute", left: 12, top: 12, color: "var(--ink-soft)" }} />
          <input className="dk-input" style={{ width: "100%", paddingLeft: 36 }} placeholder="Search name or phone to give kit…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div style={{ marginTop: 10 }}>
          {results.map((p) => {
            const kitG = isKitGiven(state, p.regId);
            return (
              <div key={p.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 6px", borderBottom: "1px solid var(--line)" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{p.phone} · {KIT_LABELS[p.kitType]}</div>
                </div>
                <button className={cx("dk-btn", kitG ? "dk-btn-outline" : "dk-btn-marigold")} style={{ padding: "9px 14px", fontSize: 13 }}
                  onClick={() => {
                    if (kitG) { showToast("Kit already given — duplicate blocked.", "danger"); return; }
                    onKitGive(p);
                    showToast(`Kit given for ${p.name}'s registration ✓`, "success");
                  }}>
                  {kitG ? "✓ Given" : "Give Kit"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, val }) {
  return (
    <div>
      <div style={{ color: "var(--ink-soft)", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase" }}>{label}</div>
      <div className="dk-display dk-tabular" style={{ fontSize: 18, fontWeight: 600 }}>{val}</div>
    </div>
  );
}

// ---------- Payments page ----------
function PaymentsPage({ stats, state, onPayment, openProfile }) {
  const { REGS, PARTS } = useData();
  const [filter, setFilter] = useState("all");

  const rows = useMemo(() => {
    return REGS.filter((r) => r.price !== null).filter((r) => {
      if (filter === "all") return true;
      return getPaymentStatus(state, r.id) === filter;
    });
  }, [filter, state, REGS]);

  return (
    <div className="dk-fade-in">
      <SectionTitle eyebrow="Collection tracker" title="Payments" color="var(--violet)" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px,1fr))", gap: 12, marginBottom: 18 }}>
        <StatCard label="Expected" value={fmtMoney(stats.expectedRevenue)} icon={Wallet} accent="var(--violet)" accentSoft="var(--violet-soft)" />
        <StatCard label="Collected" value={fmtMoney(stats.collectedRevenue)} sub={`${stats.verifiedCount} verified`} icon={ShieldCheck} accent="var(--success)" accentSoft="var(--success-soft)" />
        <StatCard label="Pending" value={fmtMoney(stats.pendingRevenue)} sub={`${stats.pendingCount} awaiting`} icon={ShieldQuestion} accent="var(--marigold)" accentSoft="var(--marigold-soft)" />
        <StatCard label="Flagged" value={stats.issuePayCount} sub="payment issues" icon={ShieldAlert} accent="var(--danger)" accentSoft="var(--danger-soft)" />
      </div>

      <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
        <AlertCircle size={13} />
        The form collects a payment-proof screenshot for every registration, but not a confirmed paid/pending status. Use "Verify" below after checking each proof.
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {[["all", "All"], ["verified", "Verified"], ["pending", "Pending"], ["issue", "Issue"]].map(([v, l]) => (
          <button key={v} className={cx("dk-btn", filter === v ? "dk-btn-primary" : "dk-btn-outline")} style={{ padding: "7px 14px", fontSize: 12.5 }} onClick={() => setFilter(v)}>{l}</button>
        ))}
      </div>

      <div className="dk-card dk-scroll" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5, minWidth: 700 }}>
          <thead>
            <tr style={{ borderBottom: "1.5px solid var(--line)" }}>
              {["Reg", "Participant(s)", "Kit", "Amount", "Proof", "Status", ""].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, textTransform: "uppercase", color: "var(--ink-soft)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const pay = getPaymentStatus(state, r.id);
              return (
                <tr key={r.id} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: "9px 12px", color: "var(--ink-soft)" }} className="dk-tabular">{r.id}</td>
                  <td style={{ padding: "9px 12px", fontWeight: 600, cursor: "pointer" }} onClick={() => openProfile(PARTS.find((p) => p.regId === r.id))}>
                    {r.participants.map((p) => p.name).filter(Boolean).join(" & ") || "Unnamed"}
                  </td>
                  <td style={{ padding: "9px 12px" }}><Badge tone={r.kitType === "Mirror" ? "mirror" : r.kitType === "Canvas" ? "clay" : "warn"}>{KIT_LABELS[r.kitType]}</Badge></td>
                  <td style={{ padding: "9px 12px" }} className="dk-tabular">{fmtMoney(r.price)}</td>
                  <td style={{ padding: "9px 12px" }}>
                    {r.paymentProofLink ? (
                      <a href={r.paymentProofLink} target="_blank" rel="noreferrer" style={{ color: "var(--mirror)", fontWeight: 600, fontSize: 12.5 }}>View</a>
                    ) : (
                      <span style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>{r.isWalkIn ? "Collected at desk" : "—"}</span>
                    )}
                  </td>
                  <td style={{ padding: "9px 12px" }}>
                    {pay === "verified" ? <Badge tone="success" icon={ShieldCheck}>Verified</Badge> : pay === "issue" ? <Badge tone="danger" icon={ShieldAlert}>Issue</Badge> : <Badge tone="ink" icon={ShieldQuestion}>Pending</Badge>}
                  </td>
                  <td style={{ padding: "9px 12px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="dk-btn dk-btn-outline" style={{ padding: "5px 10px", fontSize: 11.5 }} onClick={() => onPayment(r.id, "verified")}>Verify</button>
                      <button className="dk-btn dk-btn-outline" style={{ padding: "5px 10px", fontSize: 11.5 }} onClick={() => onPayment(r.id, "issue")}>Issue</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 ? <div style={{ padding: 30, textAlign: "center", color: "var(--ink-soft)" }}>No registrations in this filter.</div> : null}
      </div>
    </div>
  );
}

// ---------- Issues page ----------
function IssuesPage({ allIssues, state, onResolve }) {
  const [filter, setFilter] = useState("open");

  const withStatus = allIssues.map((iss) => ({
    ...iss,
    resolved: (state.resolvedIssues || {})[iss.id] || false,
  }));
  const shown = withStatus.filter((i) => (filter === "open" ? !i.resolved : filter === "resolved" ? i.resolved : true));

  const sevStyle = { error: "danger", warn: "warn", info: "ink" };

  return (
    <div className="dk-fade-in">
      <SectionTitle eyebrow={`${withStatus.filter((i) => !i.resolved).length} unresolved`} title="Issues" color="var(--danger)" />

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {[["open", "Open"], ["resolved", "Resolved"], ["all", "All"]].map(([v, l]) => (
          <button key={v} className={cx("dk-btn", filter === v ? "dk-btn-primary" : "dk-btn-outline")} style={{ padding: "7px 14px", fontSize: 12.5 }} onClick={() => setFilter(v)}>{l}</button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="dk-card" style={{ padding: 30, textAlign: "center", color: "var(--ink-soft)" }}>
          {filter === "open" ? "No open issues. The data looks clean! 🎉" : "Nothing here yet."}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {shown.map((iss) => (
            <div key={iss.id} className="dk-card" style={{ padding: 16, opacity: iss.resolved ? 0.6 : 1 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <Badge tone={sevStyle[iss.severity]} icon={AlertTriangle}>{iss.type}</Badge>
                    {iss.manual ? <Badge tone="violet">Reported at desk</Badge> : null}
                  </div>
                  <div style={{ fontSize: 13.5, lineHeight: 1.5 }}>{iss.message}</div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-soft)", marginTop: 4 }}>Registrations: {iss.regIds.join(", ")}</div>
                </div>
                <button className="dk-btn dk-btn-outline" style={{ padding: "7px 12px", fontSize: 12, flexShrink: 0 }} onClick={() => onResolve(iss.id, !iss.resolved)}>
                  {iss.resolved ? "Reopen" : "Resolve"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Reports page (summary + insights + exports) ----------
function ReportsPage({ stats, state, allIssues }) {
  const { REGS, PARTS } = useData();
  const byYear = stats.byYear;
  const maxYearCount = Math.max(1, ...Object.values(byYear));
  const noShowCount = stats.totalParticipants - stats.checkedInCount;
  const attendanceRate = stats.totalParticipants ? Math.round((stats.checkedInCount / stats.totalParticipants) * 100) : 0;
  const collectionRate = stats.expectedRevenue ? Math.round((stats.collectedRevenue / stats.expectedRevenue) * 100) : 0;
  const openIssues = allIssues.filter((i) => !(state.resolvedIssues || {})[i.id]).length;

  const mostPopularKit = ["Mirror", "Canvas", "Combo"].sort((a, b) => stats.byKit[b] - stats.byKit[a])[0];
  const mostYear = Object.entries(byYear).sort((a, b) => b[1] - a[1])[0];
  const multiKitRegs = REGS.filter((r) => r.kitType === "Multiple-Flagged").length;

  const exportRows = () => PARTS.map((p) => ({
    RegistrationID: p.regId, Name: p.name, Phone: p.phone, Email: p.email,
    Year: p.year ? (YEAR_LABELS[p.year] || p.year) : "", School: p.school, Programme: p.programme,
    Kit: KIT_LABELS[p.kitType], Amount: p.price ?? "",
    CheckedIn: isCheckedIn(state, p.key) ? "Yes" : "No",
    CheckedInAt: getParticipantState(state, p.key).checkedInAt || "",
    KitGiven: isKitGiven(state, p.regId) ? "Yes" : "No",
    PaymentStatus: getPaymentStatus(state, p.regId),
    Source: p.isWalkIn ? "Walk-in" : "Pre-registered",
  }));

  return (
    <div className="dk-fade-in">
      <SectionTitle eyebrow="Post-event report" title="Reports & Insights" color="var(--marigold)" />

      <div className="dk-card" style={{ padding: 22, marginBottom: 18 }}>
        <div className="dk-display" style={{ fontSize: 15, fontWeight: 700, letterSpacing: ".04em", color: "var(--ink-soft)", textTransform: "uppercase" }}>Desi Kalakar — Event Summary</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))", gap: 14, marginTop: 14 }}>
          <SummaryStat label="Total Registrations" val={stats.totalRegs} />
          <SummaryStat label="Participants Attended" val={stats.checkedInCount} />
          <SummaryStat label="Mirror Painting" val={stats.byKit.Mirror} />
          <SummaryStat label="Canvas Painting" val={stats.byKit.Canvas} />
          <SummaryStat label="Combo" val={stats.byKit.Combo} />
          <SummaryStat label="Kits Distributed" val={stats.kitsGivenCount} />
          <SummaryStat label="Total Revenue (Verified)" val={fmtMoney(stats.collectedRevenue)} />
          <SummaryStat label="Pending Payments" val={fmtMoney(stats.pendingRevenue)} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }} className="dk-grid-2">
        <div className="dk-card" style={{ padding: 20 }}>
          <SectionTitle eyebrow="By class year" title="Participation by Year" color="var(--mirror)" />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[1, 2, 3, 4].map((y) => {
              const val = byYear[y] || 0;
              const pct = Math.round((val / maxYearCount) * 100);
              return (
                <div key={y}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 3 }}>
                    <span style={{ fontWeight: 600 }}>{YEAR_LABELS[y]}</span>
                    <span className="dk-tabular" style={{ color: "var(--ink-soft)" }}>{val}</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 999, background: "var(--canvas-soft)" }}>
                    <div style={{ width: `${pct}%`, height: "100%", borderRadius: 999, background: "var(--mirror)" }} />
                  </div>
                </div>
              );
            })}
            {stats.totalParticipants - Object.values(byYear).reduce((a, b) => a + b, 0) > 0 ? (
              <div style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>* {stats.totalParticipants - Object.values(byYear).reduce((a, b) => a + b, 0)} participants have no year on file.</div>
            ) : null}
          </div>
        </div>

        <div className="dk-card" style={{ padding: 20 }}>
          <SectionTitle eyebrow="Attendance" title="Rate & No-Shows" color="var(--success)" />
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <Donut segments={[{ value: stats.checkedInCount, color: "var(--success)" }, { value: noShowCount, color: "var(--canvas-soft)" }]} size={104} thickness={16} />
            <div>
              <div className="dk-display" style={{ fontSize: 26, fontWeight: 600 }}>{attendanceRate}%</div>
              <div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>checked in so far</div>
              <div style={{ fontSize: 12.5, marginTop: 6 }}><b>{noShowCount}</b> not yet checked in</div>
            </div>
          </div>
        </div>
      </div>

      <div className="dk-card" style={{ padding: 20, marginBottom: 18 }}>
        <SectionTitle eyebrow="Based only on this event's data" title="Smart Insights" color="var(--violet)" />
        <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 7, fontSize: 13.5 }}>
          <li>Most popular kit: <b>{KIT_LABELS[mostPopularKit]}</b> ({stats.byKit[mostPopularKit]} registrations).</li>
          <li>Most represented year: <b>{mostYear ? YEAR_LABELS[mostYear[0]] : "Not enough data"}</b>{mostYear ? ` (${mostYear[1]} participants)` : ""}.</li>
          <li>{multiKitRegs > 0 ? <><b>{multiKitRegs}</b> registration(s) selected multiple kit options and need manual review before counting toward kit stock.</> : "No registrations have ambiguous kit selections."}</li>
          <li>Expected attendance: <b>{stats.totalParticipants}</b> participants across <b>{stats.totalRegs}</b> registrations.</li>
          <li>{stats.checkedInCount === 0 ? "No-show rate isn't meaningful yet — check-in hasn't started." : <>No-show rate so far: <b>{100 - attendanceRate}%</b> ({noShowCount} of {stats.totalParticipants}).</>}</li>
          <li>Payment collection rate: <b>{collectionRate}%</b> of expected revenue verified{stats.pendingCount ? ` — ${stats.pendingCount} registrations still awaiting verification` : ""}.</li>
          <li>Operational concerns: <b>{openIssues}</b> unresolved data issue(s) flagged. {openIssues > 0 ? "Review the Issues page before the desk gets busy." : "No open issues right now."}</li>
          {stats.walkInCount ? <li><b>{stats.walkInCount}</b> registration(s) were added on the spot at the desk, on top of {stats.originalCount} pre-registered.</li> : null}
        </ul>
      </div>

      <div className="dk-card" style={{ padding: 20 }}>
        <SectionTitle eyebrow="Share with the core team" title="Data Export" color="var(--clay)" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 10 }}>
          <ExportBtn label="Full Participant List" onClick={() => downloadCSV("desi-kalakar-participants.csv", exportRows())} />
          <ExportBtn label="Check-In List" onClick={() => downloadCSV("desi-kalakar-checkins.csv", exportRows().filter((r) => r.CheckedIn === "Yes"))} />
          <ExportBtn label="Kit Distribution List" onClick={() => downloadCSV("desi-kalakar-kits.csv", exportRows().filter((r) => r.KitGiven === "Yes"))} />
          <ExportBtn label="Payment Report" onClick={() => downloadCSV("desi-kalakar-payments.csv", exportRows().map((r) => ({ RegistrationID: r.RegistrationID, Name: r.Name, Kit: r.Kit, Amount: r.Amount, PaymentStatus: r.PaymentStatus })))} />
          <ExportBtn label="Issues Report" onClick={() => downloadCSV("desi-kalakar-issues.csv", allIssues.map((i) => ({ Type: i.type, Severity: i.severity, Message: i.message, Registrations: i.regIds.join("; "), Resolved: (state.resolvedIssues || {})[i.id] ? "Yes" : "No" })))} />
        </div>
      </div>
    </div>
  );
}

function SummaryStat({ label, val }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "var(--ink-soft)", fontWeight: 700, textTransform: "uppercase" }}>{label}</div>
      <div className="dk-display dk-tabular" style={{ fontSize: 24, fontWeight: 600 }}>{val}</div>
    </div>
  );
}

function ExportBtn({ label, onClick }) {
  return (
    <button className="dk-btn dk-btn-outline" style={{ padding: "12px 14px", fontSize: 13, display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-start" }} onClick={onClick}>
      <Download size={15} /> {label}
    </button>
  );
}

// ---------- OC Control Panel (event-day command center) ----------
function OCPanelPage({ stats, allIssues, state, setPage }) {
  const openIssues = allIssues.filter((i) => !(state.resolvedIssues || {})[i.id]).length;
  return (
    <div className="dk-fade-in">
      <SectionTitle eyebrow="Single-screen command center" title="OC Control Panel" color="var(--violet)" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px,1fr))", gap: 14 }}>
        <PanelBlock title="Registration Desk" color="var(--success)" onClick={() => setPage("checkin")}>
          <PanelRow label="Total expected" val={stats.totalParticipants} />
          <PanelRow label="Checked in" val={stats.checkedInCount} />
          <PanelRow label="Remaining" val={stats.totalParticipants - stats.checkedInCount} />
        </PanelBlock>
        <PanelBlock title="Kit Distribution" color="var(--marigold)" onClick={() => setPage("kits")}>
          <PanelRow label="Mirror remaining" val={stats.byKit.Mirror - (stats.kitGivenByType.Mirror || 0)} />
          <PanelRow label="Canvas remaining" val={stats.byKit.Canvas - (stats.kitGivenByType.Canvas || 0)} />
          <PanelRow label="Combo remaining" val={stats.byKit.Combo - (stats.kitGivenByType.Combo || 0)} />
        </PanelBlock>
        <PanelBlock title="Payment Desk" color="var(--violet)" onClick={() => setPage("payments")}>
          <PanelRow label="Verified" val={stats.verifiedCount} />
          <PanelRow label="Pending" val={stats.pendingCount} />
          <PanelRow label="Flagged" val={stats.issuePayCount} />
        </PanelBlock>
        <PanelBlock title="Issues" color="var(--danger)" onClick={() => setPage("issues")}>
          <PanelRow label="Unresolved" val={openIssues} />
          <PanelRow label="Total flagged" val={allIssues.length} />
        </PanelBlock>
      </div>
    </div>
  );
}

function PanelBlock({ title, color, children, onClick }) {
  return (
    <div className="dk-card" style={{ padding: 18, cursor: "pointer" }} onClick={onClick}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
        <div className="dk-display" style={{ fontWeight: 600, fontSize: 16 }}>{title}</div>
        <ChevronRight size={15} style={{ marginLeft: "auto", color: "var(--ink-soft)" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>{children}</div>
    </div>
  );
}
function PanelRow({ label, val }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5 }}>
      <span style={{ color: "var(--ink-soft)", fontWeight: 600 }}>{label}</span>
      <span className="dk-tabular" style={{ fontWeight: 700 }}>{val}</span>
    </div>
  );
}

// ---------- Settings page ----------
function SettingsPage({ onReset, syncOk, stats }) {
  const { REGS, PARTS } = useData();
  const [confirmText, setConfirmText] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="dk-fade-in">
      <SectionTitle eyebrow="Event configuration" title="Settings" color="var(--ink-soft)" />

      <div className="dk-card" style={{ padding: 20, marginBottom: 16 }}>
        <div className="dk-display" style={{ fontSize: 16, fontWeight: 600, marginBottom: 10 }}>Data source</div>
        <PanelRow label="Pre-registered (Excel)" val={stats.originalCount} />
        <PanelRow label="Added on the spot" val={stats.walkInCount} />
        <PanelRow label="Total registrations" val={REGS.length} />
        <PanelRow label="Total participants" val={PARTS.length} />
        <PanelRow label="Source file" val="Desi Kalakar Registrations (Responses).xlsx" />
        <PanelRow label="Event-day sync" val={syncOk ? "Shared across devices" : "This device only"} />
        <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 10 }}>
          Original registration data is read-only. Check-ins, kit distribution, payment verification, and walk-in entries are stored separately and never modify the source list.
        </div>
      </div>

      <div className="dk-card" style={{ padding: 20, border: "1.5px solid var(--danger-soft)" }}>
        <div className="dk-display" style={{ fontSize: 16, fontWeight: 600, marginBottom: 6, color: "var(--danger)" }}>Reset event-day data</div>
        <div style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 12 }}>
          Clears all check-ins, kit distributions, payment verifications, issue resolutions, <b>and any walk-in registrations added on the spot</b>, for everyone. Registration data from the Excel file is never affected. This cannot be undone.
        </div>
        {!showConfirm ? (
          <button className="dk-btn dk-btn-danger" style={{ padding: "10px 16px", fontSize: 13.5 }} onClick={() => setShowConfirm(true)}>Reset Event-Day Data…</button>
        ) : (
          <div>
            <div style={{ fontSize: 12.5, marginBottom: 8 }}>Type <b>RESET</b> to confirm:</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input className="dk-input" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} style={{ flex: 1 }} placeholder="RESET" />
              <button className="dk-btn dk-btn-danger" disabled={confirmText !== "RESET"} style={{ padding: "10px 16px", fontSize: 13.5 }}
                onClick={() => { onReset(); setShowConfirm(false); setConfirmText(""); }}>
                Confirm Reset
              </button>
              <button className="dk-btn dk-btn-outline" style={{ padding: "10px 16px", fontSize: 13.5 }} onClick={() => { setShowConfirm(false); setConfirmText(""); }}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Add Walk-in modal (on-the-spot registration) ----------
function emptyWalkInForm(prefillName) {
  return {
    name: prefillName || "", phone: "", email: "", year: "", school: "", programme: "",
    kitType: "Mirror", cashCollected: true,
    hasTeammate: false, teammateName: "", teammatePhone: "", teammateYear: "", teammateSchool: "", teammateProgramme: "",
  };
}

function AddWalkInModal({ open, onClose, onSubmit, prefillName }) {
  const [form, setForm] = useState(() => emptyWalkInForm(prefillName));

  useEffect(() => {
    if (open) setForm(emptyWalkInForm(prefillName));
  }, [open, prefillName]);

  if (!open) return null;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const phoneOk = (p) => /^\d{10}$/.test(p.trim());

  const nameOk = form.name.trim().length > 0;
  const phoneValid = phoneOk(form.phone);
  const teammateOk = !form.hasTeammate || (form.teammateName.trim().length > 0 && phoneOk(form.teammatePhone));
  const canSubmit = nameOk && phoneValid && form.kitType && teammateOk;

  const submit = () => {
    if (!canSubmit) return;
    onSubmit(form);
  };

  return (
    <Modal open={open} onClose={onClose} width={480}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--marigold-soft)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <UserPlus size={18} color="#8a5a0f" />
        </div>
        <div>
          <div className="dk-display" style={{ fontSize: 18, fontWeight: 600 }}>Add Walk-in Registration</div>
          <div style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>Stored separately from the uploaded Excel — never overwrites it.</div>
        </div>
      </div>

      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        <FieldRow>
          <Field label="Name *"><input className="dk-input" style={{ width: "100%" }} value={form.name} onChange={set("name")} placeholder="Participant name" /></Field>
          <Field label="Phone *"><input className="dk-input" style={{ width: "100%" }} value={form.phone} onChange={set("phone")} placeholder="10-digit mobile" /></Field>
        </FieldRow>
        <FieldRow>
          <Field label="Email"><input className="dk-input" style={{ width: "100%" }} value={form.email} onChange={set("email")} placeholder="optional" /></Field>
          <Field label="Year">
            <select className="dk-input" style={{ width: "100%" }} value={form.year} onChange={set("year")}>
              <option value="">—</option>
              <option value="1">1st Year</option><option value="2">2nd Year</option>
              <option value="3">3rd Year</option><option value="4">4th Year</option>
            </select>
          </Field>
        </FieldRow>
        <FieldRow>
          <Field label="School"><input className="dk-input" style={{ width: "100%" }} value={form.school} onChange={set("school")} placeholder="optional" /></Field>
          <Field label="Programme"><input className="dk-input" style={{ width: "100%" }} value={form.programme} onChange={set("programme")} placeholder="optional" /></Field>
        </FieldRow>

        <Field label="Kit *">
          <div style={{ display: "flex", gap: 8 }}>
            {["Mirror", "Canvas", "Combo"].map((k) => (
              <button key={k} type="button"
                className={cx("dk-btn", form.kitType === k ? "dk-btn-primary" : "dk-btn-outline")}
                style={{ flex: 1, padding: "9px 6px", fontSize: 12.5 }}
                onClick={() => setForm((f) => ({ ...f, kitType: k }))}>
                {KIT_LABELS[k]}<br /><span style={{ fontWeight: 500, opacity: 0.8 }}>{fmtMoney(KIT_PRICES[k])}</span>
              </button>
            ))}
          </div>
        </Field>

        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          <input type="checkbox" checked={form.hasTeammate} onChange={(e) => setForm((f) => ({ ...f, hasTeammate: e.target.checked }))} />
          Registering as a team of 2
        </label>

        {form.hasTeammate ? (
          <div style={{ background: "var(--canvas-soft)", borderRadius: 12, padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
            <FieldRow>
              <Field label="Teammate name *"><input className="dk-input" style={{ width: "100%" }} value={form.teammateName} onChange={set("teammateName")} /></Field>
              <Field label="Teammate phone *"><input className="dk-input" style={{ width: "100%" }} value={form.teammatePhone} onChange={set("teammatePhone")} /></Field>
            </FieldRow>
            <FieldRow>
              <Field label="Year">
                <select className="dk-input" style={{ width: "100%" }} value={form.teammateYear} onChange={set("teammateYear")}>
                  <option value="">—</option>
                  <option value="1">1st Year</option><option value="2">2nd Year</option>
                  <option value="3">3rd Year</option><option value="4">4th Year</option>
                </select>
              </Field>
              <Field label="School"><input className="dk-input" style={{ width: "100%" }} value={form.teammateSchool} onChange={set("teammateSchool")} /></Field>
            </FieldRow>
          </div>
        ) : null}

        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", marginTop: 2 }}>
          <input type="checkbox" checked={form.cashCollected} onChange={(e) => setForm((f) => ({ ...f, cashCollected: e.target.checked }))} />
          Payment collected at the desk (marks as verified)
        </label>

        {!phoneValid && form.phone ? <div style={{ fontSize: 11.5, color: "var(--danger)" }}>Phone number should be 10 digits.</div> : null}

        <button className="dk-btn dk-btn-success" disabled={!canSubmit} style={{ padding: "13px 10px", fontSize: 14.5, marginTop: 6 }} onClick={submit}>
          ✅ Add Registration & Check In
        </button>
      </div>
    </Modal>
  );
}

function FieldRow({ children }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>{children}</div>;
}
function Field({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".02em" }}>{label}</div>
      {children}
    </div>
  );
}

// ---------- Main App ----------
export default function App() {
  const [page, setPage] = useState("dashboard");
  const [state, setState] = useState(EMPTY_STATE);
  const [loading, setLoading] = useState(true);
  const [syncOk, setSyncOk] = useState(true);
  const [profileParticipant, setProfileParticipant] = useState(null);
  const [toast, setToast] = useState(null);
  const [addWalkInOpen, setAddWalkInOpen] = useState(false);
  const [walkInPrefill, setWalkInPrefill] = useState("");
  const toastTimer = useRef(null);

  const showToast = (message, tone = "info") => {
    setToast({ message, tone });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      const s = await loadEventState();
      if (mounted) { setState(s); setLoading(false); setSyncOk(!!window.storage); }
    })();
    const interval = setInterval(async () => {
      const s = await loadEventState();
      if (mounted) setState(s);
    }, 8000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  const mutate = async (updater) => {
    const fresh = await loadEventState();
    const next = updater(fresh);
    setState(next);
    await saveEventState(next);
    return next;
  };

  const onCheckIn = (p) => mutate((s) => ({
    ...s,
    participants: { ...s.participants, [p.key]: { ...(s.participants[p.key] || {}), checkedIn: true, checkedInAt: new Date().toISOString() } },
  }));

  const onKitGive = (p) => mutate((s) => ({
    ...s,
    registrations: { ...s.registrations, [p.regId]: { ...(s.registrations[p.regId] || {}), kitGiven: true, kitGivenAt: new Date().toISOString() } },
  }));

  const onPayment = (regIdOrParticipant, status) => {
    const regId = typeof regIdOrParticipant === "string" ? regIdOrParticipant : regIdOrParticipant.regId;
    return mutate((s) => ({
      ...s,
      registrations: { ...s.registrations, [regId]: { ...(s.registrations[regId] || {}), paymentStatus: status, paymentAt: new Date().toISOString() } },
    }));
  };

  const onIssue = (p, note) => mutate((s) => ({
    ...s,
    registrations: { ...s.registrations, [p.regId]: { ...(s.registrations[p.regId] || {}), manualIssue: note, manualIssueAt: new Date().toISOString() } },
  }));

  const onResolveIssue = (issueId, resolved) => mutate((s) => ({
    ...s,
    resolvedIssues: { ...(s.resolvedIssues || {}), [issueId]: resolved },
  }));

  const onReset = () => mutate(() => ({ ...EMPTY_STATE }));

  const openProfile = (p) => { if (p) setProfileParticipant(p); };

  const openAddWalkIn = (prefillName = "") => { setWalkInPrefill(prefillName); setAddWalkInOpen(true); };

  // Adding a walk-in: (1) create the registration record in event-day state, kept
  // fully separate from ORIGINAL_REGISTRATIONS, (2) since the person is standing at
  // the desk right now, immediately mark them (and any teammate) checked in, and
  // (3) if cash was collected, mark the payment verified.
  const onAddWalkIn = async (form) => {
    const reg = buildWalkInRegistration(form);
    const now = new Date().toISOString();
    await mutate((s) => {
      const newWalkIns = [...(s.walkIns || []), reg];
      const participants = { ...s.participants };
      reg.participants.forEach((_, i) => {
        const key = `${reg.id}:${i}`;
        participants[key] = { ...(participants[key] || {}), checkedIn: true, checkedInAt: now };
      });
      const registrations = {
        ...s.registrations,
        [reg.id]: {
          ...(s.registrations[reg.id] || {}),
          ...(form.cashCollected ? { paymentStatus: "verified", paymentAt: now } : {}),
        },
      };
      return { ...s, walkIns: newWalkIns, participants, registrations };
    });
    setAddWalkInOpen(false);
    showToast(`${reg.participants.map((p) => p.name).join(" & ")} added and checked in ✓`, "success");
  };

  // ---- merged data: original (immutable) + on-the-spot walk-ins ----
  const walkInRegs = useMemo(() => (state.walkIns || []), [state.walkIns]);
  const REGS = useMemo(() => [...ORIGINAL_REGISTRATIONS, ...walkInRegs], [walkInRegs]);
  const PARTS = useMemo(() => flattenParticipants(REGS), [REGS]);
  const dataCtx = useMemo(() => ({ REGS, PARTS }), [REGS, PARTS]);

  const allIssues = useMemo(() => computeIssues(REGS, PARTS), [REGS, PARTS]);

  // ---- derived stats ----
  const stats = useMemo(() => {
    const byKit = { Mirror: 0, Canvas: 0, Combo: 0 };
    let needsReview = 0;
    let expectedRevenue = 0;
    let soloCount = 0, teamCount = 0;
    REGS.forEach((r) => {
      if (r.kitType === "Multiple-Flagged" || r.kitType === "Unknown") { needsReview += r.kitType === "Multiple-Flagged" ? 1 : 0; }
      else byKit[r.kitType] = (byKit[r.kitType] || 0) + 1;
      if (r.price) expectedRevenue += r.price;
      if (r.numParticipants === 1) soloCount++; else teamCount++;
    });

    let checkedInCount = 0;
    PARTS.forEach((p) => { if (isCheckedIn(state, p.key)) checkedInCount++; });

    let kitsGivenCount = 0;
    let kitsGivenParticipants = 0;
    const kitGivenByType = { Mirror: 0, Canvas: 0, Combo: 0 };
    REGS.forEach((r) => {
      if (isKitGiven(state, r.id)) {
        kitsGivenCount++;
        kitsGivenParticipants += r.numParticipants;
        if (kitGivenByType[r.kitType] !== undefined) kitGivenByType[r.kitType]++;
      }
    });
    const kitsRequired = byKit.Mirror + byKit.Canvas + byKit.Combo;

    let collectedRevenue = 0, pendingRevenue = 0, verifiedCount = 0, pendingCount = 0, issuePayCount = 0;
    REGS.forEach((r) => {
      if (r.price === null) return;
      const st = getPaymentStatus(state, r.id);
      if (st === "verified") { collectedRevenue += r.price; verifiedCount++; }
      else if (st === "issue") { issuePayCount++; }
      else { pendingRevenue += r.price; pendingCount++; }
    });

    const byYear = {};
    PARTS.forEach((p) => { if (p.year) byYear[p.year] = (byYear[p.year] || 0) + 1; });

    // activity feed
    const activity = [];
    Object.entries(state.participants || {}).forEach(([key, v]) => {
      if (v.checkedIn) {
        const p = PARTS.find((pp) => pp.key === key);
        if (p) activity.push({ time: v.checkedInAt, icon: "✅", name: p.name, text: "checked in", participant: p });
      }
    });
    Object.entries(state.registrations || {}).forEach(([regId, v]) => {
      if (v.kitGiven) {
        const p = PARTS.find((pp) => pp.regId === regId);
        if (p) activity.push({ time: v.kitGivenAt, icon: "🎨", name: p.name + (p.teammates.length ? ` & ${p.teammates.join(", ")}` : ""), text: "received their kit", participant: p });
      }
      if (v.paymentStatus === "verified") {
        const p = PARTS.find((pp) => pp.regId === regId);
        if (p) activity.push({ time: v.paymentAt, icon: "💰", name: p.name, text: "payment verified", participant: p });
      }
    });
    walkInRegs.forEach((r) => {
      const p = PARTS.find((pp) => pp.regId === r.id);
      if (p) activity.push({ time: r.timestamp, icon: "📝", name: r.participants.map((pp) => pp.name).join(" & "), text: "registered as a walk-in", participant: p });
    });
    activity.sort((a, b) => new Date(b.time) - new Date(a.time));

    return {
      totalRegs: REGS.length, totalParticipants: PARTS.length,
      originalCount: ORIGINAL_REGISTRATIONS.length, walkInCount: walkInRegs.length,
      byKit, needsReview, expectedRevenue, soloCount, teamCount,
      checkedInCount, kitsGivenCount, kitsGivenParticipants, kitsRequired, kitGivenByType,
      collectedRevenue, pendingRevenue, verifiedCount, pendingCount, issuePayCount, byYear, activity,
    };
  }, [state, REGS, PARTS, walkInRegs]);

  if (loading) {
    return (
      <div className="dk-root" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <GlobalStyles />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, color: "var(--ink-soft)" }}>
          <Loader2 className="dk-spin" size={26} style={{ animation: "spin 1s linear infinite" }} />
          <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
          Loading event data…
        </div>
      </div>
    );
  }

  return (
    <DataContext.Provider value={dataCtx}>
      <div className="dk-root" style={{ display: "flex", minHeight: "100vh" }}>
        <GlobalStyles />
        <Sidebar page={page} setPage={setPage} issueCount={allIssues.filter((i) => !(state.resolvedIssues || {})[i.id]).length} syncOk={syncOk} />
        <div style={{ flex: 1, minWidth: 0, padding: "22px 24px 90px" }}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6, gap: 8 }}>
            {page === "dashboard" ? (
              <button className="dk-btn dk-btn-outline" style={{ padding: "7px 14px", fontSize: 12.5, display: "flex", alignItems: "center", gap: 6 }} onClick={() => setPage("ocpanel")}>
                <BarChart3 size={13} /> OC Control Panel
              </button>
            ) : null}
            <button className="dk-btn dk-btn-outline" style={{ padding: "7px 10px", fontSize: 12.5 }} onClick={async () => setState(await loadEventState())}>
              <RefreshCw size={13} />
            </button>
          </div>

          {page === "dashboard" && <DashboardPage stats={stats} state={state} setPage={setPage} openProfile={openProfile} openAddWalkIn={openAddWalkIn} />}
          {page === "participants" && <ParticipantsPage state={state} openProfile={openProfile} openAddWalkIn={openAddWalkIn} />}
          {page === "checkin" && <CheckInPage state={state} onCheckIn={onCheckIn} onKitGive={onKitGive} onIssue={onIssue} showToast={showToast} openAddWalkIn={openAddWalkIn} />}
          {page === "kits" && <KitManagerPage stats={stats} state={state} onKitGive={onKitGive} showToast={showToast} />}
          {page === "payments" && <PaymentsPage stats={stats} state={state} onPayment={onPayment} openProfile={openProfile} />}
          {page === "issues" && <IssuesPage allIssues={allIssues} state={state} onResolve={onResolveIssue} />}
          {page === "reports" && <ReportsPage stats={stats} state={state} allIssues={allIssues} />}
          {page === "settings" && <SettingsPage onReset={onReset} syncOk={syncOk} stats={stats} />}
          {page === "ocpanel" && <OCPanelPage stats={stats} allIssues={allIssues} state={state} setPage={setPage} />}
        </div>
        <MobileNav page={page} setPage={setPage} />

        <Modal open={!!profileParticipant} onClose={() => setProfileParticipant(null)}>
          <ProfileContent participant={profileParticipant} state={state} onCheckIn={onCheckIn} onKitGive={onKitGive} onPayment={onPayment} />
        </Modal>

        <AddWalkInModal open={addWalkInOpen} onClose={() => setAddWalkInOpen(false)} onSubmit={onAddWalkIn} prefillName={walkInPrefill} />

        <Toast toast={toast} />
      </div>
    </DataContext.Provider>
  );
}
