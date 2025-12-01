index.js
  Gabungan script lengkap untuk:
  GitHub Secrets — simpan cookie per akun:

Nama secret: COOKIE_akun1

Nilai: JSON array cookies (lebih baik) atau name=value; xs=...; c_user=...
Contoh JSON:

[
  {"name":"c_user","value":"61575555022850","domain":".facebook.com","path":"/"},
  {"name":"xs","value":"...","domain":".facebook.com","path":"/"}
]
  - Multi-akun Facebook posting + like berdasarkan schedule di Excel (sheet "posting" dan "like")
  - Ambil cookies dari GitHub Secrets / environment variables (COOKIES_JSON / COOKIES / COOKIES_<USERNAME>)
  - Download media dari GitHub Release
  - Upload media ke composer Facebook
  - Penjadwalan dengan Luxon (Asia/Jakarta) + jitter (± menit)
  - Delay acak antar akun dan antar aksi
