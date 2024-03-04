const express = require("express");
const app = express();
require("dotenv").config();
const PORT = process.env.PORT || 3000;

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
// Replace with your Supabase details and bucket name
const supabaseUrl = "https://dczqjodjshowsziauzfw.supabase.co";
// const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient('https://dczqjodjshowsziauzfw.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjenFqb2Rqc2hvd3N6aWF1emZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk1MzUxOTMsImV4cCI6MjAyNTExMTE5M30.RWi2FH7uRSuzlIWIv_H_L3tXtBKSkLbiUpJolcsoSZA');
const bucketName = "songs"; // Replace with your bucket name

const filePath = "./sample.wav"; // Replace with the actual path to your music file

async function uploadMusic() {
  const { data1, error1 } = await supabase
    .from('TEMP')
    .select('*')
    console.log("HELLO", data1);
  const { data, error } = await supabase
  .storage
  .getBucket(bucketName)
console.log(data);
  try {
    const readStream = fs.createReadStream(filePath);

    // Upload music to Supabase storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, readStream, { duplex: 'half' }, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error("Error uploading music:", error);
      return; // Handle error appropriately
    }

    console.log("Music uploaded successfully:", data.url); // Access the uploaded file URL

    // Optionally, store additional metadata in the database
    // ... (code to store metadata using supabase.from('songs'))
  } catch (error) {
    console.error("Unexpected error:", error);
  }
//   finally {
//     // Close the read stream (optional)

//   }
}

uploadMusic();



app.get("/music/:email", (req, res) => {
  const email = req.params.email;
  res.send(`Your email ID is: ${email}`);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});