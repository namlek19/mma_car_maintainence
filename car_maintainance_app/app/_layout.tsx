import React, { useState, useEffect } from "react";
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform } from "react-native";

const API_URL = "http://10.0.2.2:3000/api";
const SERVICES_LIST = ["Thay Dầu Nhớt", "Rửa Xe Toàn Diện", "Bảo Dưỡng Tổng Quát"];

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [userRole, setUserRole] = useState("user"); 
  const [currentTab, setCurrentTab] = useState("Home");


  const [authPhone, setAuthPhone] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  

  const [authName, setAuthName] = useState("");
  const [authDob, setAuthDob] = useState("");
  const [authCity, setAuthCity] = useState("");
  const [authEmail, setAuthEmail] = useState("");


  const [userInfo, setUserInfo] = useState<any>(null);

  const [bookings, setBookings] = useState([]);
  const [licensePlate, setLicensePlate] = useState("");
  const [selectedService, setSelectedService] = useState(SERVICES_LIST[0]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [timePeriod, setTimePeriod] = useState("AM"); 
  const [filterType, setFilterType] = useState("All"); 

  const handleAuth = async () => {
    if (!authPhone || !authPassword) {
      Alert.alert("Cảnh báo", "Vui lòng nhập số điện thoại và mật khẩu!");
      return;
    }

    const endpoint = isLoginMode ? "/login" : "/register";
    

    const bodyData = isLoginMode 
      ? { phone: authPhone, password: authPassword }
      : { phone: authPhone, password: authPassword, name: authName, dob: authDob, city: authCity, email: authEmail };

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      const data = await response.json();

      if (response.ok) {
        if (isLoginMode) {
          setUserRole(data.role || "user"); 
          setUserInfo({
            name: data.name,
            dob: data.dob,
            city: data.city,
            email: data.email,
            phone: authPhone
          });
          setIsLoggedIn(true); 
        } else {
          Alert.alert("Thành công", "Đăng ký thành công! Hãy đăng nhập.");
          setIsLoginMode(true);
          setAuthPassword("");
        }
      } else {
        Alert.alert("Thất bại", data.message);
      }
    } catch (error) {
      Alert.alert("Lỗi mạng", "Không thể kết nối Backend.");
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await fetch(`${API_URL}/bookings`);
      const data = await response.json();
      setBookings(data);
    } catch (error) {
      console.log("Lỗi fetch:", error);
    }
  };

  useEffect(() => {
    if (isLoggedIn) fetchBookings(); 
  }, [currentTab, isLoggedIn]);

  const validateDateLogic = (dateStr: string) => {
    const regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[012])\/(20\d\d)$/;
    if (!regex.test(dateStr)) return "Sai định dạng DD/MM/YYYY";
    
    const parts = dateStr.split('/');
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const y = parseInt(parts[2], 10);
    
    const inputDate = new Date(y, m, d);
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const maxDate = new Date();
    maxDate.setMonth(today.getMonth() + 2); 

    if (inputDate < today) return "Không đặt được ngày trong quá khứ!";
    if (inputDate > maxDate) return "Chỉ được đặt trước tối đa 2 tháng!";
    return "ok";
  };

  const handleBooking = async () => {
    if (!licensePlate || !date || !time) {
      Alert.alert("Cảnh báo", "Vui lòng nhập đủ thông tin!");
      return;
    }

    const dateCheck = validateDateLogic(date);
    if (dateCheck !== "ok") {
      Alert.alert("Lỗi ngày tháng", dateCheck);
      return;
    }

    const finalTime = `${time} ${timePeriod}`;

    try {
      const response = await fetch(`${API_URL}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: authPhone, licensePlate, service: selectedService, date, time: finalTime }),
      });

      if (response.ok) {
        Alert.alert("Tuyệt vời", "Bạn đã đặt lịch thành công!");
        setLicensePlate(""); setDate(""); setTime("");
        setCurrentTab("History");
      }
    } catch (error) {
      Alert.alert("Lỗi", "Đặt lịch thất bại!");
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await fetch(`${API_URL}/bookings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchBookings(); 
    } catch (error) {
      Alert.alert("Lỗi", "Không thể cập nhật");
    }
  };

  const parseDate = (dateStr: string) => {
    const parts = dateStr.split('/');
    if(parts.length !== 3) return new Date(0);
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  };

  const getFilteredAdminBookings = () => {
    const today = new Date();
    const filtered = bookings.filter((item: any) => {
      if (filterType === "All") return true;
      const itemDate = parseDate(item.date);
      if (filterType === "Week") {
        const dayOfWeek = today.getDay() || 7; 
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - dayOfWeek + 1);
        startOfWeek.setHours(0,0,0,0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23,59,59,999);
        return itemDate >= startOfWeek && itemDate <= endOfWeek;
      }
      if (filterType === "Month") {
        return itemDate.getMonth() === today.getMonth() && itemDate.getFullYear() === today.getFullYear();
      }
      return true;
    });
    return filtered.sort((a: any, b: any) => parseDate(a.date).getTime() - parseDate(b.date).getTime());
  };

  // --- MÀN ĐĂNG NHẬP / ĐĂNG KÝ ---
  if (!isLoggedIn) {
    return (
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.loginContainer} keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>Bảo Dưỡng Xe</Text>
            <Text style={styles.subtitle}>{isLoginMode ? "Đăng nhập" : "Đăng ký thông tin"}</Text>
            
            <TextInput placeholder="Số điện thoại" placeholderTextColor="#888" style={styles.input} keyboardType="phone-pad" value={authPhone} onChangeText={setAuthPhone} />
            <TextInput placeholder="Mật khẩu" placeholderTextColor="#888" style={styles.input} secureTextEntry value={authPassword} onChangeText={setAuthPassword} />
            
            {/* FORM MỞ RỘNG KHI ĐĂNG KÝ */}
            {!isLoginMode && (
              <>
                <TextInput placeholder="Họ và Tên (VD: Nguyễn Văn A)" placeholderTextColor="#888" style={styles.input} value={authName} onChangeText={setAuthName} />
                <TextInput placeholder="Ngày sinh (DD/MM/YYYY)" placeholderTextColor="#888" style={styles.input} value={authDob} onChangeText={setAuthDob} />
                <TextInput placeholder="Thành phố (VD: Hà Nội)" placeholderTextColor="#888" style={styles.input} value={authCity} onChangeText={setAuthCity} />
                <TextInput placeholder="Email" placeholderTextColor="#888" style={styles.input} keyboardType="email-address" value={authEmail} onChangeText={setAuthEmail} />
              </>
            )}

            <TouchableOpacity style={styles.primaryButton} onPress={handleAuth}>
              <Text style={styles.buttonText}>{isLoginMode ? "ĐĂNG NHẬP" : "ĐĂNG KÝ"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsLoginMode(!isLoginMode)} style={{ marginTop: 20 }}>
              <Text style={{ color: "#ff8c42", textAlign: "center", fontWeight: "bold" }}>
                {isLoginMode ? "Chưa có tài khoản? Đăng ký ngay" : "Đã có tài khoản? Đăng nhập"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    );
  }

  if (userRole === "admin") {
    const adminDisplayData = getFilteredAdminBookings();
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerLogo}>QUẢN TRỊ ADMIN</Text>
          <TouchableOpacity onPress={() => { setIsLoggedIn(false); setAuthPassword(""); }}>
            <Text style={styles.logoutText}>Thoát</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.content}>
          <Text style={styles.headerTitle}>Tất cả Đơn Đặt Lịch</Text>
          <View style={{flexDirection: 'row', marginBottom: 15}}>
            <TouchableOpacity onPress={() => setFilterType("All")} style={[styles.filterBtn, filterType === "All" && styles.filterBtnActive]}>
              <Text style={{color: filterType === "All" ? 'white' : '#333'}}>Tất cả</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setFilterType("Week")} style={[styles.filterBtn, filterType === "Week" && styles.filterBtnActive]}>
              <Text style={{color: filterType === "Week" ? 'white' : '#333'}}>Tuần này</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setFilterType("Month")} style={[styles.filterBtn, filterType === "Month" && styles.filterBtnActive]}>
              <Text style={{color: filterType === "Month" ? 'white' : '#333'}}>Tháng này</Text>
            </TouchableOpacity>
          </View>
          {adminDisplayData.length === 0 && <Text style={{textAlign: 'center', color: '#888'}}>Không có đơn nào trong thời gian này</Text>}
          {adminDisplayData.map((item: any, index: number) => (
            <View key={index} style={styles.card}>
              <Text style={styles.cardTitle}>{item.service}</Text>
              <Text style={styles.cardDesc}>Biển số: {item.licensePlate} | SĐT: {item.phone || "Trống"}</Text>
              <Text style={styles.cardDesc}>Ngày: {item.date} - {item.time}</Text>
              <Text style={[styles.statusBadge, { backgroundColor: item.status === 'Đã hoàn thành' ? '#4CAF50' : '#FF9800' }]}>{item.status}</Text>
              {item.status !== "Đã hoàn thành" && (
                <View style={{ flexDirection: 'row', marginTop: 15, gap: 10 }}>
                  {item.status === "Chờ xác nhận" && (
                    <TouchableOpacity style={[styles.adminBtn, {backgroundColor: '#2196F3'}]} onPress={() => updateStatus(item._id, "Đã xác nhận")}>
                      <Text style={styles.adminBtnText}>Xác nhận</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={[styles.adminBtn, {backgroundColor: '#4CAF50'}]} onPress={() => updateStatus(item._id, "Đã hoàn thành")}>
                    <Text style={styles.adminBtnText}>Hoàn thành</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerLogo}>AutoCare</Text>
        <TouchableOpacity onPress={() => { setIsLoggedIn(false); setAuthPassword(""); setCurrentTab("Home"); }}>
          <Text style={styles.logoutText}>Thoát</Text>
        </TouchableOpacity>
      </View>

      {currentTab === "Home" && (
        <ScrollView style={styles.content}>
           <Image source={{ uri: "https://images.unsplash.com/photo-1625047509168-a7026f36de04?q=80&w=800&auto=format&fit=crop" }} style={{ width: "100%", height: 160, borderRadius: 10, marginBottom: 15 }} />
          <Text style={styles.headerTitle}>Dịch Vụ Nổi Bật</Text>
          {SERVICES_LIST.map((service, index) => (
            <View key={index} style={styles.card}>
              <Text style={styles.cardTitle}>{service}</Text>
              <Text style={styles.cardDesc}>Dịch vụ chuyên nghiệp, phụ tùng chính hãng.</Text>
              <TouchableOpacity style={styles.primaryButton} onPress={() => { setSelectedService(service); setCurrentTab("Booking"); }}>
                <Text style={styles.buttonText}>ĐẶT LỊCH NGAY</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {currentTab === "Booking" && (
        <ScrollView style={styles.content}>
          <Text style={styles.headerTitle}>Đặt Lịch Mới</Text>
          <View style={styles.card}>
            <Text style={styles.label}>Chọn Dịch Vụ:</Text>
            <View style={{flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15}}>
              {SERVICES_LIST.map(s => (
                <TouchableOpacity key={s} onPress={() => setSelectedService(s)} style={{ padding: 8, borderWidth: 1, borderColor: selectedService === s ? '#ff8c42' : '#ddd', borderRadius: 5, marginRight: 5, marginBottom: 5, backgroundColor: selectedService === s ? '#ff8c42' : 'white'}}>
                  <Text style={{color: selectedService === s ? 'white' : '#333'}}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Biển số xe:</Text>
            <TextInput placeholderTextColor="#888" value={licensePlate} onChangeText={setLicensePlate} placeholder="VD: 30A-123.45" style={styles.input} />
            <Text style={styles.label}>Ngày bảo dưỡng:</Text>
            <TextInput placeholderTextColor="#888" value={date} onChangeText={setDate} placeholder="DD/MM/YYYY" style={styles.input} />
            <Text style={styles.label}>Giờ bảo dưỡng:</Text>
            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 15}}>
              <TextInput placeholderTextColor="#888" value={time} onChangeText={setTime} placeholder="VD: 08:30" keyboardType="numeric" style={[styles.input, {flex: 1, marginBottom: 0}]} />
              <TouchableOpacity onPress={() => setTimePeriod('AM')} style={{padding: 12, backgroundColor: timePeriod === 'AM' ? '#ff8c42' : '#eee', marginLeft: 10, borderRadius: 8}}>
                <Text style={{color: timePeriod === 'AM' ? 'white' : '#333', fontWeight: 'bold'}}>AM</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setTimePeriod('PM')} style={{padding: 12, backgroundColor: timePeriod === 'PM' ? '#ff8c42' : '#eee', marginLeft: 10, borderRadius: 8}}>
                <Text style={{color: timePeriod === 'PM' ? 'white' : '#333', fontWeight: 'bold'}}>PM</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.primaryButton} onPress={handleBooking}>
              <Text style={styles.buttonText}>XÁC NHẬN ĐẶT LỊCH</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {currentTab === "History" && (
        <ScrollView style={styles.content}>
          
          <View style={styles.profileCard}>
            <Text style={styles.profileName}>{userInfo?.name || 'Thành viên AutoCare'}</Text>
            <Text style={styles.profileText}>📞 {userInfo?.phone}</Text>
            {userInfo?.email ? <Text style={styles.profileText}>📧 {userInfo?.email}</Text> : null}
            <View style={{flexDirection: 'row', justifyContent: 'center', marginTop: 8, gap: 15}}>
              {userInfo?.dob ? <Text style={styles.profileSmall}>🎂 {userInfo?.dob}</Text> : null}
              {userInfo?.city ? <Text style={styles.profileSmall}>📍 {userInfo?.city}</Text> : null}
            </View>
          </View>

          <Text style={styles.headerTitle}>Lịch Sử Của Bạn</Text>
          {bookings.length === 0 ? (
            <Text style={{ textAlign: "center", marginTop: 20, color: "#888" }}>Chưa có lịch đặt nào.</Text>
          ) : (
            [...bookings].reverse().map((item: any, index: number) => (
              <View key={index} style={styles.card}>
                <Text style={styles.cardTitle}>{item.service}</Text>
                <Text style={styles.cardDesc}>Biển số: {item.licensePlate}</Text>
                <Text style={styles.cardDesc}>Ngày: {item.date} - {item.time}</Text>
                <Text style={[styles.statusBadge, { backgroundColor: item.status === 'Đã hoàn thành' ? '#4CAF50' : '#FF9800' }]}>{item.status}</Text>
              </View>
            ))
          )}
        </ScrollView>
      )}

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => setCurrentTab("Home")}>
          <Text style={[styles.navText, currentTab === "Home" && styles.navTextActive]}>Dịch Vụ</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setCurrentTab("Booking")}>
          <Text style={[styles.navText, currentTab === "Booking" && styles.navTextActive]}>Đặt Lịch</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setCurrentTab("History")}>
          <Text style={[styles.navText, currentTab === "History" && styles.navTextActive]}>Lịch Sử</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f4f9", paddingTop: 40 },
  loginContainer: { flexGrow: 1, justifyContent: "center", padding: 20 },
  title: { fontSize: 28, fontWeight: "bold", color: "#1a3a52", textAlign: "center", marginBottom: 10 },
  subtitle: { fontSize: 16, color: "#666", textAlign: "center", marginBottom: 30 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 15, backgroundColor: "#1a3a52" },
  headerLogo: { color: "white", fontSize: 20, fontWeight: "bold" },
  logoutText: { color: "#ff8c42", fontWeight: "bold" },
  content: { flex: 1, padding: 15 },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#333", marginBottom: 15 },
  card: { backgroundColor: "white", padding: 15, borderRadius: 10, marginBottom: 15, elevation: 3 },
  cardTitle: { fontSize: 18, fontWeight: "bold", color: "#1a3a52", marginBottom: 5 },
  cardDesc: { color: "#666", marginBottom: 10 },
  label: { fontSize: 14, fontWeight: "bold", color: "#333", marginBottom: 5, marginTop: 10 },
  input: { backgroundColor: "white", borderWidth: 1, borderColor: "#ddd", padding: 12, borderRadius: 8, marginBottom: 15, fontSize: 16, color: 'black' },
  primaryButton: { backgroundColor: "#ff8c42", padding: 15, borderRadius: 8, alignItems: "center", marginTop: 10 },
  buttonText: { color: "white", fontWeight: "bold", fontSize: 16 },
  statusBadge: { alignSelf: "flex-start", color: "white", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 5, fontSize: 12, fontWeight: "bold", marginTop: 10 },
  bottomNav: { flexDirection: "row", backgroundColor: "white", borderTopWidth: 1, borderTopColor: "#eee", paddingTop: 10, paddingBottom: 30 },  navItem: { flex: 1, alignItems: "center", paddingVertical: 10 },
  navText: { color: "#888", fontWeight: "bold" },
  navTextActive: { color: "#ff8c42" },
  adminBtn: { flex: 1, padding: 10, borderRadius: 5, alignItems: 'center' },
  adminBtnText: { color: 'white', fontWeight: 'bold' },
  filterBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', backgroundColor: '#e0e0e0', marginHorizontal: 2, borderRadius: 5 },
  filterBtnActive: { backgroundColor: '#1a3a52' },

  profileCard: { backgroundColor: 'white', padding: 20, borderRadius: 10, marginBottom: 25, alignItems: 'center', elevation: 4, shadowColor: '#1a3a52', shadowOpacity: 0.1, shadowRadius: 5 },
  profileName: { fontSize: 24, fontWeight: 'bold', color: '#1a3a52', marginBottom: 5 },
  profileText: { color: '#555', fontSize: 15, marginBottom: 3 },
  profileSmall: { color: '#888', fontSize: 13, fontWeight: '500' }
});