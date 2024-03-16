from fastapi import FastAPI, HTTPException
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import Optional
from bson import ObjectId
from pymongo import MongoClient, DESCENDING
import replicate
import os
from datetime import datetime

load_dotenv()

app = FastAPI()
# MONGODB_URL = os.getenv('MONGODB_URL')
MONGODB_URL = 'mongodb+srv://thisissatyajit05:7N0L8oFxSzg7AjZm@cluster0.wzqodsm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
client = MongoClient(MONGODB_URL)

db = client["Cluster0"]

musics_collection = db["musics"]

class MusicRequest(BaseModel):
    email: str
    prompt: str
    duration: int
    style: str
    instrument: str

class AuthRequest(BaseModel):
    email: str
    password: str

@app.post("/api/music")
async def generate_music(music_request: MusicRequest):
    try:
        custom_prompt = f"{music_request.prompt}. Music style: {music_request.style}. Music Instrument: {music_request.instrument}."

        output = replicate.run(
            "meta/musicgen:b05b1dff1d8c6dc63d14b0cdb42135378dcb87f6373b0d3d341ede46e59e2b38",
            input={
                "top_k": 250,
                "top_p": 0,
                "prompt": custom_prompt,
                "duration": music_request.duration,
                "temperature": 1,
                "continuation": False,
                "model_version": "stereo-melody-large",
                "output_format": "wav",
                "continuation_start": 0,
                "multi_band_diffusion": False,
                "normalization_strategy": "peak",
                "classifier_free_guidance": 3
            }
        )

        new_document = {
            "email": music_request.email,
            "output": output,
            "prompt": music_request.prompt,
            "duration": music_request.duration,
            "style": music_request.style,
            "instrument": music_request.instrument,
            "created_at": datetime.now(), 
        }

        result = musics_collection.insert_one(new_document)
        
        return {"message": "ok", "result": output}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")

@app.get("/api/music/{email}")
async def get_music_by_email(email: str):
    try:
        collection = db["musics"]
        
        documents = collection.find({'email': email}).sort("created_at", DESCENDING)
        
        music_list = []

        for document in documents:
            document["_id"] = str(document["_id"])
            print("D", document)
            music_list.append(document)

        return {"music_list": music_list}
    except Exception as error:
        print('Error fetching documents:', error)
        raise HTTPException(status_code=500, detail=f"error: {str(error)}")

@app.delete("/api/music/{music_id}")
async def delete_music_by_id(music_id: str):
    try:
        collection = db["musics"]

        result = collection.delete_one({"_id": ObjectId(music_id)})

        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Record not found")

        return {"message": "ok", "result": f"Deleted {result.deleted_count} record(s)"}
    except Exception as error:
        print('Error deleting document:', error)
        raise HTTPException(status_code=500, detail=f"error: {str(error)}")

@app.post("/api/auth")
async def auth_user(auth_data: AuthRequest):
    try:
        collection = db["user"]
        user_document = collection.find_one({'email': auth_data.email})

        if user_document:
            if user_document["password"] == auth_data.password:
                return {"email": auth_data.email}
            else:
                raise HTTPException(status_code=401, detail="Incorrect password")

        else:
            collection.insert_one({
                "email": auth_data.email,
                "password": auth_data.password
            })
            return {"email": auth_data.email}

    except Exception as error:
        print('Error authenticating user:', error)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(error)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)
