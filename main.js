const { createClient } = require("@supabase/supabase-js");
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
const fs = require('fs');
const supabase = createClient(
  "https://dczqjodjshowsziauzfw.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjenFqb2Rqc2hvd3N6aWF1emZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwOTUzNTE5MywiZXhwIjoyMDI1MTExMTkzfQ.XcEKL7CEFsHmSCOFfTxQ3Gic2wAneTxeZHVdX8gI_z8"
);
const filePath = "./sample.wav"; 
const musicsaver = async (email,prompt) => {
try {
    const readStream = fs.createReadStream(filePath);
    
const { data: audioData, error: audioError } = await supabase
  .storage
  .from('songs')
  .upload(filePath, readStream, {
    contentType: 'audio/wav',
    upsert: true,
    duplex: 'half'
  })
  console.log(audioData);
    
if (audioError) {
    console.error("Error uploading music:", error);
    return; 
  }

  const { data: userData, error: userError } = await supabase
  .from("audio_users")
  .insert({
    email: email,
    audio_id: audioData.id,
    audio_name: audioData.path,
    prompt : prompt
  });

if (userError) {
  console.error("Error storing email and audio reference:", userError);
  return;
}

console.log("Audio uploaded successfully and linked to hashed email.");
} catch (error) {
console.error("Unexpected error:", error);
}

  console.log("Music uploaded successfully:"); 
}
// musicsaver("santanujuvekar@gmail.com");





app.get("/music/:email/:song", async (req, res) => {
    const email = req.params.email;
    const song = req.params.song; 
    console.log(email,song)
        try {
            // Retrieve the audio file data from the database based on the provided email and song
            const { data: songData, error: songError } = await supabase
              .from("audio_users") // Replace with your table name
              .select("audio_id") // Replace with the column containing the audio path
            //   .eq("audio_name", song) // Compare hashed emails
              .single();
        
            if (songError) {
              console.error("Error retrieving song data:", songError);
              return res.status(500).json({ error: "Internal server error" });
            }
        
            if (!songData) {
              return res.status(404).json({ error: "Song not found" });
            }
        
            // Check user's authorization to access the requested song based on the retrieved information
            // (implement your authorization logic here, using the found songData)
        
            // **Avoid directly sending the audio file in the response.**
            // Generate a temporary download URL with a limited expiration time for security.  
            
            const { data: downloadUrlData, error: downloadUrlError } = await supabase.storage
              .from("songs") // Replace with your audio storage bucket name
              .getPublicUrl(song)

              
              console.log(downloadUrlData);
        
            if (downloadUrlError) {
              console.error("Error generating download URL:", downloadUrlError);
            }
        
            res.status(200).json({
              downloadUrl: downloadUrlData.publicUrl, // Provide the temporary download URL
            });
          } catch (error) {
            console.error("Unexpected error:", error);
            return res.status(500).json({ error: "Internal server error" });
          }
        
    });
    app.get("/music/:email", async (req, res) => {
        const email = req.params.email;

      
        try {
          // Retrieve all song names associated with the email
          const { data: songData, error: songError } = await supabase
            .from("audio_users") // Replace with your table name
            .select("audio_name") // Replace with the column containing song names
            .eq("email", email) // Compare hashed emails
            .single();
      
          if (songError) {
            console.error("Error retrieving song data:", songError);
            return res.status(500).json({ error: "Internal server error" });
          }
      
          if (!songData) {
            return res.status(404).json({ error: "Email not found" });
          }
      
          // Check user's authorization to access the song list based on the retrieved information
          // (implement your authorization logic here, using the found songData)
      
          // Extract and return the song names as an array
          const songNames = songData.song_names || []; // Handle empty array gracefully
      
          res.json({ songs: songNames });
        } catch (error) {
          console.error("Unexpected error:", error);
          return res.status(500).json({ error: "Internal server error" });
        }
      });
// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
  
