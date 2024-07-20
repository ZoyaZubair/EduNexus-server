import TryCatch from "../middlewares/TryCatch.js";
import { Courses } from "../models/Courses.js";
import { Lecture } from "../models/Lecture.js";
import { User } from "../models/User.js";
import crypto from 'crypto'
import {Payment} from '../models/Payment.js'
import { instance } from '../index.js';

export const getAllCourses = TryCatch(async (req, res) => {
  const courses = await Courses.find();
  res.json({
    courses,
  });
});

export const getSingleCourse = TryCatch(async (req, res) => {
  const course = await Courses.findById(req.params.id);

  res.json({
    course,
  });
});

export const fetchLectures = TryCatch(async (req, res) => {
    const lectures = await Lecture.find({ course: req.params.id });
  
    const user = await User.findById(req.user._id);
  
    if (user.role === "admin") {
      return res.json({ lectures });
    }
  
    if (!user.subscription.includes(req.params.id))
      return res.status(400).json({
        message: "You have not subscribed to this course",
      });
  
    res.json({ lectures });
  });

  export const fetchLecture = TryCatch(async (req, res) => {
    const lecture = await Lecture.findById(req.params.id);
  
    const user = await User.findById(req.user._id);
  
    if (user.role === "admin") {
      return res.json({ lecture });
    }
  
    if (!user.subscription.includes(lecture.course))
      return res.status(400).json({
        message: "You have not subscribed to this course",
      });
  
    res.json({ lecture });
  });
  
  export const getMyCourses = TryCatch(async (req, res) => {
    const courses = await Courses.find({ _id: req.user.subscription });
  
    res.json({
      courses,
    });
  });


  export const checkout = TryCatch(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const course = await Courses.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
  
    if (user.subscription.includes(course._id)) {
      return res.status(400).json({
        message: "You already have this course",
      });
    }
  
    const options = {
      amount: Number(course.price * 100), // Amount in the smallest currency unit
      currency: "INR",
    };
  
    try {
      const order = await instance.orders.create(options);
      res.status(201).json({
        order,
        course,
      });
    } catch (error) {
      console.error("Order creation failed:", error);
      res.status(500).json({ message: "Order creation failed" });
    }
  });
  
  
  export const paymentVerification = TryCatch(async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
  
    console.log('Received payment verification request:', { razorpay_order_id, razorpay_payment_id, razorpay_signature });
  
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.Razorpay_Secret)
      .update(body)
      .digest('hex');
  
    console.log('Expected signature:', expectedSignature);
  
    const isAuthentic = expectedSignature === razorpay_signature;
  
    if (isAuthentic) {
      const existingPayment = await Payment.findOne({ razorpay_order_id });
      if (existingPayment) {
        return res.status(400).json({ message: "Payment already processed" });
      }
  
      const payment = await Payment.create({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      });
  
      if (!payment) {
        return res.status(500).json({ message: "Payment creation failed" });
      }
  
      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      const course = await Courses.findById(req.params.id);
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
  
      user.subscription.push(course._id);
      await user.save();
  
      res.status(200).json({ message: 'Course Purchased Successfully' });
    } else {
      console.error('Payment verification failed');
      res.status(400).json({ message: 'Payment Failed' });
    }
  });
  