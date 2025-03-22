import React, { useState } from "react";
import MonacoEditor from "@monaco-editor/react";
import axios from "axios";

const Editor = () => {
    const [language, setLanguage] = useState("python");
    const [code, setCode] = useState("");
    const [output, setOutput] = useState("");

    const handleRun = async () => {
        try {
            const { data } = await axios.post("http://localhost:5000/run", { language, code });
            setOutput(data.output || data.error);
        } catch (error) {
            setOutput("Error executing code");
        }
    };

    return (
        <div>
            <select onChange={(e) => setLanguage(e.target.value)} value={language}>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
            </select>

            <MonacoEditor height="300px" language={language} value={code} onChange={setCode} />

            <button onClick={handleRun}>Run Code</button>
            
            <h3>Output:</h3>
            <pre>{output}</pre>
        </div>
    );
};

export default Editor;
