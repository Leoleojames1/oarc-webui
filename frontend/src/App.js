import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { motion } from 'framer-motion';

function App() {
  const [labels, setLabels] = useState({});
  const [selectedLabel, setSelectedLabel] = useState('');
  const [positions, setPositions] = useState([]);
  const [coords, setCoords] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [videoFrame, setVideoFrame] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const socketRef = useRef(null);

  useEffect(() => {
    console.log("App component mounted");
    setDebugInfo(prevInfo => prevInfo + "\nApp component mounted");
    fetchLabels();
    initializeSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const initializeSocket = () => {
    setDebugInfo(prevInfo => prevInfo + "\nInitializing socket...");
    socketRef.current = io('http://localhost:5000', {
      transports: ['websocket'],
      upgrade: false,
    });
    socketRef.current.on('connect', () => {
      setDebugInfo(prevInfo => prevInfo + "\nSocket connected");
    });
    socketRef.current.on('video_frame', (data) => {
      setVideoFrame(`data:image/jpeg;base64,${data.image}`);
      setDebugInfo(prevInfo => prevInfo + "\nReceived video frame");
    });
    socketRef.current.on('connect_error', (error) => {
      setDebugInfo(prevInfo => prevInfo + `\nSocket connection error: ${error.message}`);
    });
  };

  const fetchLabels = async () => {
    try {
      const response = await axios.get('http://localhost:5000/labels');
      setLabels(response.data);
      setDebugInfo(prevInfo => prevInfo + "\nFetched labels");
    } catch (error) {
      console.error('Error fetching labels:', error);
      setDebugInfo(prevInfo => prevInfo + `\nError fetching labels: ${error.message}`);
    }
  };

  const handleLabelChange = async (event) => {
    const label = event.target.value;
    setSelectedLabel(label);
    try {
      const response = await axios.get(`http://localhost:5000/positions/${label}`);
      setPositions(response.data);
    } catch (error) {
      console.error('Error fetching positions:', error);
      setDebugInfo(prevInfo => prevInfo + `\nError fetching positions: ${error.message}`);
    }
  };

  const handleReadImage = async () => {
    try {
      const response = await axios.post('http://localhost:5000/read_image', { coords: coords.split(' ').map(Number) });
      setExtractedText(response.data.text);
    } catch (error) {
      console.error('Error reading image:', error);
      setDebugInfo(prevInfo => prevInfo + `\nError reading image: ${error.message}`);
    }
  };

  const handleSendMessage = async () => {
    if (inputMessage.trim() === '') return;
  
    setChatMessages(prevMessages => [...prevMessages, { role: 'user', content: inputMessage }]);
    setInputMessage('');
  
    try {
      const response = await axios.post('http://localhost:5000/chat', { message: inputMessage });
      setChatMessages(prevMessages => [...prevMessages, { role: 'ai', content: response.data.response }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setDebugInfo(prevInfo => prevInfo + `\nError sending message: ${error.message}`);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-4">
        <h1 className="text-2xl font-bold">YOLO Vision App</h1>
      </header>
      <main className="flex-grow flex">
        <motion.div 
          className="w-3/4 p-4"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {videoFrame ? (
              <img 
                src={videoFrame}
                alt="YOLO Vision Feed" 
                className="w-full h-auto"
              />
            ) : (
              <p className="p-4">Loading video feed...</p>
            )}
          </div>
          <div className="mt-4 bg-white rounded-lg shadow p-4">
            <h2 className="text-xl font-semibold mb-2">Debug Info</h2>
            <pre className="whitespace-pre-wrap">{debugInfo}</pre>
          </div>
          <div className="mt-4">
            <select onChange={handleLabelChange} value={selectedLabel} className="w-full p-2 border rounded">
              <option value="">Select a label</option>
              {Object.entries(labels).map(([label, count]) => (
                <option key={label} value={label}>{`${label} (${count})`}</option>
              ))}
            </select>
          </div>
          {selectedLabel && (
            <div className="mt-4 bg-white rounded-lg shadow p-4">
              <h2 className="text-xl font-semibold mb-2">Positions for {selectedLabel}</h2>
              <ul>
                {positions.map((pos, index) => (
                  <li key={index}>{`[${pos.join(', ')}]`}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-4">
            <input
              type="text"
              value={coords}
              onChange={(e) => setCoords(e.target.value)}
              placeholder="Enter coordinates (x1 y1 x2 y2)"
              className="w-full p-2 border rounded mb-2"
            />
            <button onClick={handleReadImage} className="w-full bg-blue-500 text-white p-2 rounded">Read Image</button>
            {extractedText && (
              <div className="mt-2 bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold">Extracted Text:</h3>
                <p>{extractedText}</p>
              </div>
            )}
          </div>
        </motion.div>
        <motion.div 
          className="w-1/4 p-4"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-white rounded-lg shadow-lg h-full flex flex-col">
            <div className="flex-grow overflow-y-auto p-4">
              {chatMessages.map((message, index) => (
                <div key={index} className={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <span className={`inline-block p-2 rounded-lg ${message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                    {message.content}
                  </span>
                </div>
              ))}
            </div>
            <div className="p-4 border-t">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="w-full p-2 border rounded-lg"
                placeholder="Ask about the vision..."
              />
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

export default App;