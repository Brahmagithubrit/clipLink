import mongoose from "mongoose"

export const connectDB = () => {
    console.log ("entr into db connect ")
    mongoose.connect("mongodb://127.0.0.1:27017/clipLink")
        .then(() => { console.log("db connect success") })
        .catch(e => console.log("error in db connect", e))
}