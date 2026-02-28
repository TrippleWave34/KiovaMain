from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"Hello": "World"}

#Log In/ Register
@app.post("/login")
async def login():
    return {"message": "Login endpoint"}
@app.post("/register")
async def register():
    return {"message": "Register endpoint"}