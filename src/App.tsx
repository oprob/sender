import React, { useState } from 'react';
import { Send, Mail, Upload, RefreshCw } from 'lucide-react';
import { Editor } from '@tinymce/tinymce-react';
import { Toaster, toast } from 'react-hot-toast';

interface EmailConfig {
  host: string;
  port: string;
  username: string;
  password: string;
  email: string;
  name: string;
  replyTo: string;
}

interface SendStatus {
  email: string;
  status: 'success' | 'error';
  message: string;
}

function App() {
  const [config, setConfig] = useState<EmailConfig>({
    host: '',
    port: '',
    username: '',
    password: '',
    email: '',
    name: '',
    replyTo: ''
  });

  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [recipients, setRecipients] = useState<string[]>([]);
  const [sendStatus, setSendStatus] = useState<SendStatus[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const testConnection = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Connection successful!');
        setIsConnected(true);
      } else {
        toast.error(data.message);
        setIsConnected(false);
      }
    } catch (error) {
      toast.error('Connection failed');
      setIsConnected(false);
    }
    setIsLoading(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const emails = text.split('\n')
        .map(email => email.trim())
        .filter(email => email.length > 0);
      setRecipients(emails);
      toast.success(`Loaded ${emails.length} recipients`);
    };
    reader.readAsText(file);
  };

  const sendEmails = async () => {
    if (!isConnected) {
      toast.error('Please configure and test email connection first');
      return;
    }

    if (!subject || !content || recipients.length === 0) {
      toast.error('Please fill all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/send-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config,
          subject,
          html: content,
          recipients
        })
      });
      
      const data = await response.json();
      setSendStatus(data.results);
      
      const successCount = data.results.filter((r: SendStatus) => r.status === 'success').length;
      toast.success(`Successfully sent ${successCount} out of ${recipients.length} emails`);
    } catch (error) {
      toast.error('Failed to send emails');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <Toaster position="top-right" />
      
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-800">Heisenberg's Sender</h1>

        {/* Configuration Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Configuration
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">SMTP Host</label>
              <input
                type="text"
                name="host"
                value={config.host}
                onChange={handleConfigChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="smtp.gmail.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Port</label>
              <input
                type="text"
                name="port"
                value={config.port}
                onChange={handleConfigChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="587"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <input
                type="text"
                name="username"
                value={config.username}
                onChange={handleConfigChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="your_username"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                name="password"
                value={config.password}
                onChange={handleConfigChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Sender Email</label>
              <input
                type="email"
                name="email"
                value={config.email}
                onChange={handleConfigChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="sender@example.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Sender Name</label>
              <input
                type="text"
                name="name"
                value={config.name}
                onChange={handleConfigChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Reply-To Email</label>
              <input
                type="email"
                name="replyTo"
                value={config.replyTo}
                onChange={handleConfigChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <button
            onClick={testConnection}
            disabled={isLoading}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              'Test Connection'
            )}
          </button>
        </div>

        {/* Compose Email Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Compose Email</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
              <Editor apiKey='ancxpd6ajhy8mu68zc3997vvzqfz4iyzjlh7dy1oc726cmhi'
                init={{
                  height: 300,
                  menubar: true,
                  readonly: false,
                  promotion: false,
                  plugins: [
                    'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                    'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                    'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                  ],
                  toolbar: 'undo redo | blocks | ' +
                    'bold italic forecolor | alignleft aligncenter ' +
                    'alignright alignjustify | bullist numlist outdent indent | ' +
                    'removeformat | help'
                }}
                onEditorChange={(content) => setContent(content)}
              />
            </div>
          </div>
        </div>

        {/* Recipients Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Recipients
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Upload Recipients (TXT file)</label>
              <input
                type="file"
                accept=".txt"
                onChange={handleFileUpload}
                className="mt-1 block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
            </div>
            
            <div>
              <p className="text-sm text-gray-600">
                {recipients.length} recipients loaded
              </p>
              {recipients.length > 0 && (
                <div className="mt-2 p-2 bg-gray-50 rounded-md max-h-32 overflow-y-auto">
                  {recipients.map((email, index) => (
                    <div key={index} className="text-sm text-gray-600">{email}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Send Button */}
        <div className="flex justify-end">
          <button
            onClick={sendEmails}
            disabled={isLoading || !isConnected}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Emails
              </>
            )}
          </button>
        </div>

        {/* Status Section */}
        {sendStatus.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Send Status</h2>
            <div className="space-y-2">
              {sendStatus.map((status, index) => (
                <div
                  key={index}
                  className={`p-2 rounded-md ${
                    status.status === 'success' ? 'bg-green-50' : 'bg-red-50'
                  }`}
                >
                  <span className="font-medium">{status.email}:</span>{' '}
                  <span className={status.status === 'success' ? 'text-green-600' : 'text-red-600'}>
                    {status.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;