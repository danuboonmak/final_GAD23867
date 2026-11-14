// ตั้งค่าก่อนเปิดแคมเปญจริง
// leadEndpoint: URL ของ form backend ที่รับข้อมูลผู้เล่น (เช่น Google Apps Script web app)
//   - ระบบส่งเป็น POST, body เป็น JSON (Content-Type: text/plain เพื่อเลี่ยง CORS preflight)
//   - ทุกเรคคอร์ดมี "id" ประจำรอบเล่น: ถ้า id ซ้ำ ให้ backend เขียนทับแถวเดิม (เช่น ตอนผู้เล่นกดรับข่าวสารทีหลัง)
// ปล่อยว่าง = เก็บไว้ในเครื่องผู้เล่นเท่านั้น ข้อมูลไม่ถึง SDM (ใช้ตอนพัฒนาเท่านั้น)
window.IMAGINE_CONFIG = {
  leadEndpoint: "",
};
