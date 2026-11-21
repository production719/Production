# บันทึกข้อมูลผลิต (ไลน์นึ่ง / รีด / ตัด / แพ็ค)

เว็บบันทึกข้อมูลการผลิตรายวันของ Foodle Noodle — ล็อกอินด้วย Google และเก็บข้อมูลใน Supabase

- **เว็บ:** https://production719.github.io/Production/
- **เวอร์ชันปัจจุบัน:** ดูป้าย "เวอร์ชัน" มุมบนของเว็บ หรือ [CHANGELOG.md](CHANGELOG.md)
- ลิงก์ตรงไปแต่ละไลน์: `#steam` (นึ่ง) `#press` (รีด) `#cut` (ตัด) `#pack` (แพ็ค)

## ระบบ

| ส่วน | รายละเอียด |
|---|---|
| หน้าเว็บ | `index.html` ไฟล์เดียว เผยแพร่ด้วย GitHub Pages |
| ล็อกอิน | Supabase Auth — Google |
| ฐานข้อมูล | Supabase ตาราง `prod_steam`, `prod_press`, `prod_cut`, `prod_pack` |
| สิทธิ์ | ตาราง `prod_allowed_emails` (role: `editor` = บันทึก/แก้ไข/ลบ, `viewer` = ดูอย่างเดียว) + Row Level Security |

ทุกรายการเก็บ `created_at`, `created_by_email`, `updated_at`, `updated_by_email` อัตโนมัติ และหน้าเว็บอัปเดตทันทีเมื่อมีคนบันทึก (Realtime)

## ตั้งค่าครั้งแรก (ทำครั้งเดียว)

ใน Supabase Dashboard → **Authentication → URL Configuration** → **Redirect URLs** → เพิ่ม

```
https://production719.github.io/Production/
```

(ถ้าไม่เพิ่ม หลังล็อกอิน Google จะพากลับไปที่ Site URL แทนหน้านี้)

## เพิ่ม / ลบ ผู้ใช้

Supabase Dashboard → **Table Editor → `prod_allowed_emails`** → Insert row ใส่อีเมล และ role (`editor` หรือ `viewer`)
หรือใช้ SQL Editor:

```sql
insert into prod_allowed_emails(email, role) values ('someone@foodlenoodle.com', 'editor');
delete from prod_allowed_emails where email = 'someone@foodlenoodle.com';
```

## การขึ้นเวอร์ชันใหม่

แก้ `const VERSION` และเพิ่มรายการบนสุดของ `CHANGELOG` ใน `index.html` แล้วบันทึกลง `CHANGELOG.md`
แก้เล็กน้อย → 3.0 → 3.1 · เปลี่ยนโครงสร้างใหญ่ → 4.0

## หมายเหตุ

- คีย์ใน `index.html` เป็น Publishable key ของ Supabase ใส่ในหน้าเว็บได้ตามปกติ — การเข้าถึงข้อมูลคุมด้วย RLS (คนที่ไม่อยู่ใน `prod_allowed_emails` จะอ่าน/เขียนไม่ได้)
- รุ่น v2.x ที่ใช้ Google Sheets + Apps Script เลิกใช้แล้ว
