const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const Docker = require("dockerode");

const app = express();
app.use(cors());
app.use(express.json());

const docker = new Docker();
const CODE_DIR = path.join(__dirname, "temp_code");

if (!fs.existsSync(CODE_DIR)) fs.mkdirSync(CODE_DIR);

const runInDocker = async (language, code, res) => {
    let fileName, image, runCmd;
    
    if (language === "python") {
        fileName = "script.py";
        image = "python:3.10";
        runCmd = `python3 /app/${fileName}`;
    } else if (language === "java") {
        fileName = "Main.java";
        image = "openjdk:latest";
        runCmd = `java /app/Main.java && java -cp /app Main`;
    } else if (language === "cpp") {
        fileName = "program.cpp";
        image = "gcc:latest";
        runCmd = `g++ /app/program.cpp -o /app/program && /app/program`;
    } else {
        return res.json({ error: "Unsupported language" });
    }

    const filePath = `${CODE_DIR}/${fileName}`;
    fs.writeFileSync(filePath, code);

    try {
        const container = await docker.createContainer({
            Image: image,
            Cmd: ["sh", "-c", runCmd],
            AttachStdout: true,
            AttachStderr: true,
            Tty: false,
            HostConfig: {
                Binds: [`${CODE_DIR}:/app`],
                NetworkMode: "none", // No internet access for security
                AutoRemove: true,
            },
        });

        await container.start();
        const stream = await container.logs({ stdout: true, stderr: true, follow: true });

        let output = "";
        stream.on("data", (chunk) => (output += chunk.toString()));
        stream.on("end", () => res.json({ output }));
    } catch (error) {
        res.json({ error: "Execution error" });
    }
};

app.post("/run", (req, res) => {
    const { language, code } = req.body;
    runInDocker(language, code, res);
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
