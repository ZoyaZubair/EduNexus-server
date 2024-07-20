import express from 'express'
import dotenv from "dotenv";
import { connectDb } from "./database/db.js";
import Razorpay from 'razorpay'
import cors from "cors";

dotenv.config();

// Debugging to check if env variables are loaded correctly
console.log('Razorpay Key:', process.env.Razorpay_Key);
console.log('Razorpay Secret:', process.env.Razorpay_Secret);
console.log('PORT:', process.env.PORT);

export const instance = new Razorpay({
    key_id: rzp_test_fvJgHjYbdo5eCd,
    key_secret: vn8zNf2ENwKFkHy8qkEOZhl3,
});


const app = express(); 

// using middlewares
app.use(express.json());
app.use(cors());

const port = process.env.PORT;

app.get('/',(req,res)=>{
    res.send("Server is working");
});

app.use("/uploads", express.static("uploads"));

// importing routes
import userRoutes from "./routes/user.js";
import courseRoutes from "./routes/course.js";
import adminRoutes from "./routes/admin.js";


// using routes
app.use("/api", userRoutes);
app.use("/api", courseRoutes);
app.use("/api", adminRoutes);


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    connectDb();
});