// Script to merge admin boundaries based on Resolution 202/2025/QH15
// Note: This is an architectural outline. In this environment, I'll need to manually
// process the GeoJSON data based on this mapping logic.

const mapping = {
  "Tuyên Quang": ["Hà Giang", "Tuyên Quang"],
  "Lào Cai": ["Yên Bái", "Lào Cai"],
  "Thái Nguyên": ["Bắc Kạn", "Thái Nguyên"],
  "Phú Thọ": ["Vĩnh Phúc", "Hòa Bình", "Phú Thọ"],
  "Bắc Ninh": ["Bắc Giang", "Bắc Ninh"],
  "Hưng Yên": ["Thái Bình", "Hưng Yên"],
  "Hải Phòng": ["Hải Phòng"], // Check resolution mapping
  "Ninh Bình": ["Hà Nam", "Nam Định", "Ninh Bình"],
  "Quảng Trị": ["Quảng Bình", "Quảng Trị"],
  "Đà Nẵng": ["Đà Nẵng", "Quảng Nam"],
  "Quảng Ngãi": ["Kon Tum", "Quảng Ngãi"],
  "Gia Lai": ["Bình Định", "Gia Lai"],
  "Khánh Hòa": ["Ninh Thuận", "Khánh Hòa"],
  "Lâm Đồng": ["Đắk Nông", "Bình Thuận", "Lâm Đồng"],
  "Đắk Lắk": ["Phú Yên", "Đắk Lắk"],
  "Thành phố Hồ Chí Minh": ["Thành phố Hồ Chí Minh", "Bà Rịa - Vũng Tàu", "Bình Dương"],
  "Đồng Nai": ["Bình Phước", "Đồng Nai"],
  "Tây Ninh": ["Long An", "Tây Ninh"],
  "Thành phố Cần Thơ": ["Cần Thơ", "Sóc Trăng", "Hậu Giang"],
  "Vĩnh Long": ["Bến Tre", "Trà Vinh", "Vĩnh Long"],
  "Đồng Tháp": ["Tiền Giang", "Đồng Tháp"],
  "Cà Mau": ["Bạc Liêu", "Cà Mau"],
  "An Giang": ["Kiên Giang", "An Giang"]
};
