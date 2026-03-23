const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt'); 

const app = express();
app.use(cors());
app.use(express.json());

const dbURI = 'mongodb://127.0.0.1:27017/car_booking_db'; 
mongoose.connect(dbURI)
  .then(() => console.log('✅ Đã kết nối MongoDB!'))
  .catch((err) => console.log('❌ Lỗi kết nối DB', err));

const bookingSchema = new mongoose.Schema({
  phone: { type: String },
  licensePlate: { type: String, required: true },
  service: { type: String, required: true }, 
  date: { type: String, required: true },
  time: { type: String, required: true },
  status: { type: String, default: 'Chờ xác nhận' }
});
const Booking = mongoose.model('Booking', bookingSchema);

const userSchema = new mongoose.Schema({
  phone: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' },
  name: { type: String },
  dob: { type: String },
  city: { type: String },
  email: { type: String }
});
const User = mongoose.model('User', userSchema);

app.post('/api/register', async (req, res) => {
  try {
    const { phone, password, name, dob, city, email } = req.body;
    const existingUser = await User.findOne({ phone });
    if (existingUser) return res.status(400).json({ message: 'Số điện thoại đã tồn tại!' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({ phone, password: hashedPassword, name, dob, city, email });
    await newUser.save();
    res.status(201).json({ message: 'Đăng ký thành công!' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    const user = await User.findOne({ phone });
    if (!user) return res.status(400).json({ message: 'Sai số điện thoại hoặc mật khẩu!' });
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ message: 'Sai số điện thoại hoặc mật khẩu!' });
    

    res.status(200).json({ 
      message: 'Đăng nhập thành công!', 
      role: user.role,
      name: user.name,
      dob: user.dob,
      city: user.city,
      email: user.email
    }); 
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

app.get('/api/bookings', async (req, res) => {
  const bookings = await Booking.find().sort({ _id: -1 });
  res.json(bookings);
});

app.post('/api/bookings', async (req, res) => {
  const newBooking = new Booking(req.body);
  await newBooking.save();
  res.status(201).json(newBooking);
});

app.put('/api/bookings/:id', async (req, res) => {
  try {
    const { status } = req.body;
    await Booking.findByIdAndUpdate(req.params.id, { status });
    res.json({ message: 'Đã cập nhật trạng thái' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi cập nhật' });
  }
});

app.listen(3000, () => console.log(`🚀 Server chạy tại http://localhost:3000`));