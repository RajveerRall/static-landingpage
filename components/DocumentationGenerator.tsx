'use client';

import React, { useState, useCallback } from 'react';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';
import MDEditor from '@uiw/react-md-editor';
import rehypeSanitize from 'rehype-sanitize';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FiCopy, FiRefreshCw } from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';
import './GoogleAnalytics';

// Add this at the top of your file, after imports
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

export default function DocumentationGenerator() {
  const [file, setFile] = useState<File | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [markdownContent, setMarkdownContent] = useState('# Your generated documentation');

  // --- File selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setIsGenerated(false);
    }
  };

  // --- Check usage before generating documentation
  const checkUsageBeforeGenerate = async (): Promise<boolean> => {
    try {
      const resp = await fetch('/api/use-feature', {
        method: 'POST',
        credentials: 'include', // Ensures cookies are sent
      });
      if (!resp.ok) {
        if (resp.status === 403) {
          // Limit reached
          toast.error('You have used the free limit. Please sign up!');
          return false;
        }
        // Some other error
        toast.error('Error checking usage limit.');
        return false;
      }
      // If 200 → usage is okay
      return true;
    } catch (err) {
      console.error('Usage check failed:', err);
      toast.error('Error checking usage. Please try again.');
      return false;
    }
  };

  // --- Fetch a presigned URL for uploading the video
  const getPresignedUploadURL = async (file: File): Promise<{ uploadURL: string; key: string } | null> => {
    try {
      const response = await fetch('/api/get-presigned-url', {
        method: 'POST',
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();

      if (!response.ok) {
        console.error('Error response from /api/get-presigned-url:', data);
        toast.error(data.message || 'Failed to get upload URL.');
        return null;
      }
      if (!data.uploadURL || !data.key) {
        console.error('Invalid response data:', data);
        toast.error('Invalid response from server.');
        return null;
      }
      return { uploadURL: data.uploadURL as string, key: data.key as string };
    } catch (error: any) {
      console.error('Error fetching presigned URL:', error);
      toast.error('An error occurred while getting the upload URL.');
      return null;
    }
  };

  // --- Upload the file to S3
  const uploadFileToS3 = async (file: File, uploadURL: string): Promise<boolean> => {
    try {
      console.log('Uploading file to S3:', file.name);
      const response = await fetch(uploadURL, {
        method: 'PUT',
        body: file,
      });
      console.log('Upload response status:', response.status);

      if (!response.ok) {
        let errorMsg = `Upload failed with status ${response.status}`;
        if (response.status === 403) {
          errorMsg = 'Upload failed: Forbidden. Check your permissions.';
        }
        console.error(errorMsg);
        toast.error(errorMsg);
        return false;
      }

      console.info('File uploaded to S3 successfully.');
      toast.success('File uploaded to S3 successfully!');
      return true;
    } catch (error: any) {
      console.error('Error uploading file to S3:', error);
      toast.error('An error occurred during the file upload.');
      return false;
    }
  };

  // --- Poll for the generated Markdown
  const getPresignedMarkdownURL = async (baseFileName: string): Promise<string | null> => {
    try {
      const response = await fetch('/api/get-generated-markdown-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: baseFileName }),
      });
      if (!response.ok) {
        // Non-200 → doc not ready
        return null;
      }
      const data = await response.json();
      return data.markdownURL as string;
    } catch (error) {
      console.error('Error fetching presigned Markdown URL:', error);
      return null;
    }
  };

  // --- Main "Generate" flow
  const handleGenerate = useCallback(async () => {
    // GA4 example
    window.gtag('event', 'Doc-generated', {
      event_category: 'landing_page',
      event_label: 'try_feature_button',
    });

    if (!file) {
      toast.error('Please select a video file to upload.');
      return;
    }
    setIsLoading(true);

    // a) Check usage limit first
    const canUseFeature = await checkUsageBeforeGenerate();
    if (!canUseFeature) {
      setIsLoading(false);
      return;
    }

    // b) Get a presigned URL
    const presignedData = await getPresignedUploadURL(file);
    if (!presignedData) {
      setIsLoading(false);
      return;
    }

    const { uploadURL, key } = presignedData;

    // c) Upload the video to S3
    const uploadSuccess = await uploadFileToS3(file, uploadURL);
    if (!uploadSuccess) {
      setIsLoading(false);
      return;
    }
    toast.success('Video uploaded successfully! Video is being processed...');

    // d) Poll for the doc
    const baseFileName = key.split('/').pop()?.replace(/\.[^/.]+$/, '') || '';
    let attempts = 0;
    const maxAttempts = 36; // 36 attempts × 5s = 180s (3 minutes)
    const pollInterval = 5000; // 5 seconds

    const pollForDoc = setInterval(async () => {
      attempts += 1;
      try {
        const markdownURL = await getPresignedMarkdownURL(baseFileName);
        if (markdownURL) {
          const markdownResponse = await fetch(markdownURL);
          if (markdownResponse.ok) {
            const markdown = await markdownResponse.text();
            setMarkdownContent(markdown);
            setIsGenerated(true);
            toast.success('Documentation generated successfully!');
            clearInterval(pollForDoc);
            setIsLoading(false);
          } else {
            // Removed toast.error here to avoid immediate error toasts
            console.warn(`Markdown present but fetch failed: ${markdownResponse.status}`);
          }
        } else {
          // markdownURL === null → doc not ready yet (404 or not found)
          console.info(`Doc not ready. Attempt ${attempts}/${maxAttempts}`);
        }
      } catch (error) {
        console.error('Error fetching generated markdown:', error);
        // Keep polling in case of transient errors
      }

      if (attempts >= maxAttempts) {
        clearInterval(pollForDoc);
        setIsLoading(false);
        toast.error('Documentation took too long. Please try again later.');
      }
    }, pollInterval);
  }, [file]);

  // --- Copy to Clipboard
  const handleCopy = useCallback(() => {
    if (markdownContent.trim()) {
      navigator.clipboard.writeText(markdownContent)
        .then(() => {
          toast.success('Content copied to clipboard!');
        })
        .catch((err) => {
          toast.error('Failed to copy content.');
          console.error('Failed to copy:', err);
        });
    } else {
      toast.error('The document is empty. Nothing to copy.');
    }
  }, [markdownContent]);

  // --- Reset the component state
  const handleReset = useCallback(() => {
    setFile(null);
    setCustomPrompt('');
    setIsGenerated(false);
    setMarkdownContent('# Your generated documentation');
    toast('You can upload a new video to generate documentation.', { icon: '🔄' });
  }, []);

  return (
    <div className="relative w-full h-full min-h-screen flex items-center justify-center p-6">
      <Toaster position="top-right" />
      <div className="relative w-full max-w-7xl h-[90vh] bg-white bg-opacity-20 backdrop-blur-lg border border-white border-opacity-30 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex-1 p-6 overflow-hidden">
          <MDEditor
            value={markdownContent}
            onChange={(value) => { setMarkdownContent(value ?? '') }}
            height={600}
            previewOptions={{ rehypePlugins: [rehypeSanitize] }}
            textareaProps={{ placeholder: "Your generated documentation will appear here..." }}
            className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg p-2 h-full overflow-auto"
          />
        </div>

        {!isGenerated && (
          <div className="absolute inset-0 bg-white bg-opacity-20 backdrop-blur-md z-10 flex items-center justify-center">
            <div className="bg-white bg-opacity-25 backdrop-blur-md p-8 rounded-xl shadow-lg z-20 border border-white border-opacity-20 w-full max-w-md mx-4">
              <h2 className="text-2xl font-bold text-center mb-6 text-[#0B4D4A]">Upload Screen Recording</h2>
              <Input
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="w-full mb-4 bg-white bg-opacity-50 text-gray-800"
              />
              <Input
                type="text"
                placeholder="Add custom prompt (optional)"
                className="w-full mb-4 bg-white bg-opacity-50 text-gray-800"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
              />
              <Button
                onClick={handleGenerate}
                disabled={!file || isLoading}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md transition duration-300 flex items-center justify-center"
              >
                {isLoading ? 'Generating...' : 'Generate Documentation'}
              </Button>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-30">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {isGenerated && (
          <>
            <button
              onClick={handleCopy}
              className="absolute top-4 right-4 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-lg backdrop-blur-md bg-opacity-50 z-20 flex items-center justify-center"
              title="Copy to Clipboard"
              aria-label="Copy to Clipboard"
            >
              <FiCopy size={20} />
            </button>

            <button
              onClick={handleReset}
              className="absolute top-4 left-4 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg backdrop-blur-md bg-opacity-50 z-20 flex items-center justify-center"
              title="Reset and Upload New Video"
              aria-label="Reset and Upload New Video"
            >
              <FiRefreshCw size={20} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}



// 'use client';

// import React, { useState, useCallback } from 'react';
// import '@uiw/react-md-editor/markdown-editor.css';
// import '@uiw/react-markdown-preview/markdown.css';
// import MDEditor from '@uiw/react-md-editor';
// import rehypeSanitize from 'rehype-sanitize';
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { FiCopy, FiRefreshCw } from 'react-icons/fi';
// import toast, { Toaster } from 'react-hot-toast';
// import './GoogleAnalytics';

// // Add this at the top of your file, after imports
// declare global {
//   interface Window {
//     gtag: (...args: any[]) => void;
//   }
// }

// export default function DocumentationGenerator() {
//   const [file, setFile] = useState<File | null>(null);
//   const [customPrompt, setCustomPrompt] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const [isGenerated, setIsGenerated] = useState(false);
//   const [markdownContent, setMarkdownContent] = useState('# Your generated documentation');

//   // --- File selection
//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files && e.target.files[0]) {
//       setFile(e.target.files[0]);
//       setIsGenerated(false);
//     }
//   };

//   // --- Check usage before generating documentation
//   const checkUsageBeforeGenerate = async (): Promise<boolean> => {
//     try {
//       const resp = await fetch('/api/use-feature', {
//         method: 'POST',
//         credentials: 'include',
//       });
//       if (!resp.ok) {
//         if (resp.status === 403) {
//           // Limit reached
//           toast.error('You have used the free limit. Please sign up!');
//           return false;
//         }
//         // Some other error
//         toast.error('Error checking usage limit.');
//         return false;
//       }
//       // If 200 → usage is okay
//       return true;
//     } catch (err) {
//       console.error('Usage check failed:', err);
//       toast.error('Error checking usage. Please try again.');
//       return false;
//     }
//   };

//   // --- Fetch a presigned URL for uploading the video
//   const getPresignedUploadURL = async (file: File): Promise<{ uploadURL: string; key: string } | null> => {
//     try {
//       const response = await fetch('/api/get-presigned-url', {
//         method: 'POST',
//         body: JSON.stringify({
//           fileName: file.name,
//           fileType: file.type,
//         }),
//       });
//       const data = await response.json();

//       if (!response.ok) {
//         console.error('Error response from /api/get-presigned-url:', data);
//         toast.error(data.message || 'Failed to get upload URL.');
//         return null;
//       }
//       if (!data.uploadURL || !data.key) {
//         console.error('Invalid response data:', data);
//         toast.error('Invalid response from server.');
//         return null;
//       }
//       return { uploadURL: data.uploadURL as string, key: data.key as string };
//     } catch (error: any) {
//       console.error('Error fetching presigned URL:', error);
//       toast.error('An error occurred while getting the upload URL.');
//       return null;
//     }
//   };

//   // --- Upload the file to S3
//   const uploadFileToS3 = async (file: File, uploadURL: string): Promise<boolean> => {
//     try {
//       console.log('Uploading file to S3:', file.name);
//       const response = await fetch(uploadURL, {
//         method: 'PUT',
//         body: file,
//       });
//       console.log('Upload response status:', response.status);

//       if (!response.ok) {
//         let errorMsg = `Upload failed with status ${response.status}`;
//         if (response.status === 403) {
//           errorMsg = 'Upload failed: Forbidden. Check your permissions.';
//         }
//         console.error(errorMsg);
//         toast.error(errorMsg);
//         return false;
//       }

//       console.info('File uploaded to S3 successfully.');
//       toast.success('File uploaded to S3 successfully!');
//       return true;
//     } catch (error: any) {
//       console.error('Error uploading file to S3:', error);
//       toast.error('An error occurred during the file upload.');
//       return false;
//     }
//   };

//   // --- Poll for the generated Markdown
//   const getPresignedMarkdownURL = async (baseFileName: string): Promise<string | null> => {
//     try {
//       const response = await fetch('/api/get-generated-markdown-url', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ fileName: baseFileName }),
//       });
//       if (!response.ok) {
//         // Non-200 → doc not ready
//         return null;
//       }
//       const data = await response.json();
//       return data.markdownURL as string;
//     } catch (error) {
//       console.error('Error fetching presigned Markdown URL:', error);
//       return null;
//     }
//   };

//   // --- Main "Generate" flow
//   const handleGenerate = useCallback(async () => {
//     // GA4 example
//     window.gtag('event', 'Doc-generated', {
//       event_category: 'landing_page',
//       event_label: 'try_feature_button',
//     });

//     if (!file) {
//       toast.error('Please select a video file to upload.');
//       return;
//     }
//     setIsLoading(true);

//     // a) Check usage limit first
//     const canUseFeature = await checkUsageBeforeGenerate();
//     if (!canUseFeature) {
//       setIsLoading(false);
//       return;
//     }

//     // b) Get a presigned URL
//     const presignedData = await getPresignedUploadURL(file);
//     if (!presignedData) {
//       setIsLoading(false);
//       return;
//     }

//     const { uploadURL, key } = presignedData;

//     // c) Upload the video to S3
//     const uploadSuccess = await uploadFileToS3(file, uploadURL);
//     if (!uploadSuccess) {
//       setIsLoading(false);
//       return;
//     }
//     toast.success('Video uploaded successfully! Video is being processed...');

//     // d) Poll for the doc
//     const baseFileName = key.split('/').pop()?.replace(/\.[^/.]+$/, '') || '';
//     let attempts = 0;
//     const maxAttempts = 36; // 36 attempts × 5s = 180s (3 minutes)
//     const pollInterval = 5000; // 5 seconds

//     const pollForDoc = setInterval(async () => {
//       attempts += 1;
//       try {
//         const markdownURL = await getPresignedMarkdownURL(baseFileName);
//         if (markdownURL) {
//           const markdownResponse = await fetch(markdownURL);
//           if (markdownResponse.ok) {
//             const markdown = await markdownResponse.text();
//             setMarkdownContent(markdown);
//             setIsGenerated(true);
//             toast.success('Documentation generated successfully!');
//             clearInterval(pollForDoc);
//             setIsLoading(false);
//           } else {
//             // Removed toast.error to avoid immediate error toasts
//             console.warn(`Markdown present but fetch failed: ${markdownResponse.status}`);
//           }
//         } else {
//           // markdownURL === null → doc not ready yet (404 or not found)
//           console.info(`Doc not ready. Attempt ${attempts}/${maxAttempts}`);
//         }
//       } catch (error) {
//         console.error('Error fetching generated markdown:', error);
//         // Keep polling in case of transient errors
//       }

//       if (attempts >= maxAttempts) {
//         clearInterval(pollForDoc);
//         setIsLoading(false);
//         toast.error('Documentation took too long. Please try again later.');
//       }
//     }, pollInterval);
//   }, [file]);

//   // --- Copy to Clipboard
//   const handleCopy = useCallback(() => {
//     if (markdownContent.trim()) {
//       navigator.clipboard.writeText(markdownContent)
//         .then(() => {
//           toast.success('Content copied to clipboard!');
//         })
//         .catch((err) => {
//           toast.error('Failed to copy content.');
//           console.error('Failed to copy:', err);
//         });
//     } else {
//       toast.error('The document is empty. Nothing to copy.');
//     }
//   }, [markdownContent]);

//   // --- Reset the component state
//   const handleReset = useCallback(() => {
//     setFile(null);
//     setCustomPrompt('');
//     setIsGenerated(false);
//     setMarkdownContent('# Your generated documentation');
//     toast('You can upload a new video to generate documentation.', { icon: '🔄' });
//   }, []);

//   return (
//     <div className="relative w-full h-full min-h-screen flex items-center justify-center p-6">
//       <Toaster position="top-right" />
//       <div className="relative w-full max-w-7xl h-[90vh] bg-white bg-opacity-20 backdrop-blur-lg border border-white border-opacity-30 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
//         <div className="flex-1 p-6 overflow-hidden">
//           <MDEditor
//             value={markdownContent}
//             onChange={(value) => { setMarkdownContent(value ?? '') }}
//             height={600}
//             previewOptions={{ rehypePlugins: [rehypeSanitize] }}
//             textareaProps={{ placeholder: "Your generated documentation will appear here..." }}
//             className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg p-2 h-full overflow-auto"
//           />
//         </div>

//         {!isGenerated && (
//           <div className="absolute inset-0 bg-white bg-opacity-20 backdrop-blur-md z-10 flex items-center justify-center">
//             <div className="bg-white bg-opacity-25 backdrop-blur-md p-8 rounded-xl shadow-lg z-20 border border-white border-opacity-20 w-full max-w-md mx-4">
//               <h2 className="text-2xl font-bold text-center mb-6 text-[#0B4D4A]">Upload Screen Recording</h2>
//               <Input
//                 type="file"
//                 accept="video/*"
//                 onChange={handleFileChange}
//                 className="w-full mb-4 bg-white bg-opacity-50 text-gray-800"
//               />
//               <Input
//                 type="text"
//                 placeholder="Add custom prompt (optional)"
//                 className="w-full mb-4 bg-white bg-opacity-50 text-gray-800"
//                 value={customPrompt}
//                 onChange={(e) => setCustomPrompt(e.target.value)}
//               />
//               <Button
//                 onClick={handleGenerate}
//                 disabled={!file || isLoading}
//                 className="w-full bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md transition duration-300 flex items-center justify-center"
//               >
//                 {isLoading ? 'Generating...' : 'Generate Documentation'}
//               </Button>
//             </div>
//           </div>
//         )}

//         {isLoading && (
//           <div className="absolute inset-0 bg-white bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-30">
//             <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
//           </div>
//         )}

//         {isGenerated && (
//           <>
//             <button
//               onClick={handleCopy}
//               className="absolute top-4 right-4 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-lg backdrop-blur-md bg-opacity-50 z-20 flex items-center justify-center"
//               title="Copy to Clipboard"
//               aria-label="Copy to Clipboard"
//             >
//               <FiCopy size={20} />
//             </button>

//             <button
//               onClick={handleReset}
//               className="absolute top-4 left-4 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg backdrop-blur-md bg-opacity-50 z-20 flex items-center justify-center"
//               title="Reset and Upload New Video"
//               aria-label="Reset and Upload New Video"
//             >
//               <FiRefreshCw size={20} />
//             </button>
//           </>
//         )}
//       </div>
//     </div>
//   );
// }




// 'use client'

// import React, { useState, useCallback, useEffect } from 'react'
// import '@uiw/react-md-editor/markdown-editor.css'
// import '@uiw/react-markdown-preview/markdown.css'
// import MDEditor from '@uiw/react-md-editor'
// import rehypeSanitize from 'rehype-sanitize'
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { FiCopy, FiRefreshCw } from 'react-icons/fi'
// import toast, { Toaster } from 'react-hot-toast'
// import './GoogleAnalytics'
// import '../utils/ensureSessionId'


// // Add this at the top of your file, after imports
// declare global {
//   interface Window {
//     gtag: (...args: any[]) => void;
//   }
// }


// export default function DocumentationGenerator() {
//   const [file, setFile] = useState<File | null>(null)
//   const [customPrompt, setCustomPrompt] = useState('')
//   const [isLoading, setIsLoading] = useState(false)
//   const [isGenerated, setIsGenerated] = useState(false)
//   const [markdownContent, setMarkdownContent] = useState('# Your generated documentation')



//   // --- File selection
//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files && e.target.files[0]) {
//       setFile(e.target.files[0])
//       setIsGenerated(false)
//     }
//   }



//   const checkUsageBeforeGenerate = async (): Promise<boolean> => {
//     try {
//       const resp = await fetch('/api/use-feature', {
//         method: 'POST',
//         credentials: 'include',
//       })
//       if (!resp.ok) {
//         if (resp.status === 403) {
//           // Limit reached
//           toast.error('You have used the free limit. Please sign up!')
//           return false
//         }
//         // Some other error
//         toast.error('Error checking usage limit.')
//         return false
//       }
//       // If 200 → usage is okay
//       return true
//     } catch (err) {
//       console.error('Usage check failed:', err)
//       toast.error('Error checking usage. Please try again.')
//       return false
//     }
//   }
  

//   // 2. Existing logic to fetch a presigned URL
//   const getPresignedUploadURL = async (file: File): Promise<{ uploadURL: string; key: string } | null> => {
//     try {
//       const response = await fetch('/api/get-presigned-url', {
//         method: 'POST',
//         body: JSON.stringify({
//           fileName: file.name,
//           fileType: file.type,
//         }),
//       })
//       const data = await response.json()

//       if (!response.ok) {
//         console.error('Error response from /api/get-presigned-url:', data)
//         toast.error(data.message || 'Failed to get upload URL.')
//         return null
//       }
//       if (!data.uploadURL || !data.key) {
//         console.error('Invalid response data:', data)
//         toast.error('Invalid response from server.')
//         return null
//       }
//       return { uploadURL: data.uploadURL as string, key: data.key as string }
//     } catch (error: any) {
//       console.error('Error fetching presigned URL:', error)
//       toast.error('An error occurred while getting the upload URL.')
//       return null
//     }
//   }

//   // 3. Upload the file to S3
//   const uploadFileToS3 = async (file: File, uploadURL: string): Promise<boolean> => {
//     try {
//       console.log('Uploading file to S3:', file.name)
//       const response = await fetch(uploadURL, {
//         method: 'PUT',
//         body: file,
//       })
//       console.log('Upload response status:', response.status)

//       if (!response.ok) {
//         let errorMsg = `Upload failed with status ${response.status}`
//         if (response.status === 403) {
//           errorMsg = 'Upload failed: Forbidden. Check your permissions.'
//         }
//         console.error(errorMsg)
//         toast.error(errorMsg)
//         return false
//       }

//       console.info('File uploaded to S3 successfully.')
//       toast.success('File uploaded to S3 successfully!')
//       return true
//     } catch (error: any) {
//       console.error('Error uploading file to S3:', error)
//       toast.error('An error occurred during the file upload.')
//       return false
//     }
//   }

//   // 4. Poll for the generated Markdown
//   const getPresignedMarkdownURL = async (baseFileName: string): Promise<string | null> => {
//     try {
//       const response = await fetch('/api/get-generated-markdown-url', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ fileName: baseFileName }),
//       })
//       if (!response.ok) {
//         // Non-200 → doc not ready
//         return null
//       }
//       const data = await response.json()
//       return data.markdownURL as string
//     } catch (error) {
//       console.error('Error fetching presigned Markdown URL:', error)
//       return null
//     }
//   }

//   // 5. Main "Generate" flow
//   const handleGenerate = useCallback(async () => {

//         // GA4 example
//       window.gtag('event', 'Doc-generated', {
//           event_category: 'landing_page',
//           event_label: 'try_feature_button',
//         })

//     if (!file) {
//       toast.error('Please select a video file to upload.')
//       return
//     }
//     setIsLoading(true)

//     // a) Check usage limit first
//     const canUseFeature = await checkUsageBeforeGenerate()
//     if (!canUseFeature) {
//       setIsLoading(false)
//       return
//     }

//     // b) Get a presigned URL
//     const presignedData = await getPresignedUploadURL(file)
//     if (!presignedData) {
//       setIsLoading(false)
//       return
//     }

//     const { uploadURL, key } = presignedData

//     // c) Upload the video to S3
//     const uploadSuccess = await uploadFileToS3(file, uploadURL)
//     if (!uploadSuccess) {
//       setIsLoading(false)
//       return
//     }
//     toast.success('Video uploaded successfully! Video is being processed...')

//     // d) Poll for the doc
//     const baseFileName = key.split('/').pop()?.replace(/\.[^/.]+$/, '') || ''
//     let attempts = 0
//     const maxAttempts = 36
//     const pollInterval = 5000
//     const pollForDoc = setInterval(async () => {
//       attempts += 1
//       try {
//         const markdownURL = await getPresignedMarkdownURL(baseFileName)
//         if (markdownURL) {
//           const markdownResponse = await fetch(markdownURL)
//           if (markdownResponse.ok) {
//             const markdown = await markdownResponse.text()
//             setMarkdownContent(markdown)
//             setIsGenerated(true)
//             toast.success('Documentation generated successfully!')
//             clearInterval(pollForDoc)
//             setIsLoading(false)
//           } else {
//             console.warn(`Markdown present but fetch failed: ${markdownResponse.status}`)
//           }
//         } else {
//           console.info(`Doc not ready. Attempt ${attempts}/${maxAttempts}`)
//         }
//       } catch (error) {
//         console.error('Error fetching generated markdown:', error)
//       }

//       if (attempts >= maxAttempts) {
//         clearInterval(pollForDoc)
//         setIsLoading(false)
//         toast.error('Documentation took too long. Please try again later.')
//       }
//     }, pollInterval)
//   }, [file])

//   // 6. Copy & Reset remain unchanged
//   const handleCopy = useCallback(() => {
//     if (markdownContent.trim()) {
//       navigator.clipboard.writeText(markdownContent)
//         .then(() => {
//           toast.success('Content copied to clipboard!')
//         })
//         .catch((err) => {
//           toast.error('Failed to copy content.')
//           console.error('Failed to copy:', err)
//         })
//     } else {
//       toast.error('The document is empty. Nothing to copy.')
//     }
//   }, [markdownContent])

//   const handleReset = useCallback(() => {
//     setFile(null)
//     setCustomPrompt('')
//     setIsGenerated(false)
//     setMarkdownContent('# Your generated documentation')
//     toast('You can upload a new video to generate documentation.', { icon: '🔄' })
//   }, [])

//   return (
//     <div className="relative w-full h-full min-h-screen flex items-center justify-center p-6">
//       <Toaster position="top-right" />
//       <div className="relative w-full max-w-7xl h-[90vh] bg-white bg-opacity-20 backdrop-blur-lg border border-white border-opacity-30 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
//         <div className="flex-1 p-6 overflow-hidden">
//           <MDEditor
//             value={markdownContent}
//             onChange={(value) => { setMarkdownContent(value ?? '') }}
//             height={600}
//             previewOptions={{ rehypePlugins: [rehypeSanitize] }}
//             textareaProps={{ placeholder: "Your generated documentation will appear here..." }}
//             className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg p-2 h-full overflow-auto"
//           />
//         </div>

//         {!isGenerated && (
//           <div className="absolute inset-0 bg-white bg-opacity-20 backdrop-blur-md z-10 flex items-center justify-center">
//             <div className="bg-white bg-opacity-25 backdrop-blur-md p-8 rounded-xl shadow-lg z-20 border border-white border-opacity-20 w-full max-w-md mx-4">
//               <h2 className="text-2xl font-bold text-center mb-6 text-[#0B4D4A]">Upload Screen Recording</h2>
//               <Input
//                 type="file"
//                 accept="video/*"
//                 onChange={handleFileChange}
//                 className="w-full mb-4 bg-white bg-opacity-50 text-gray-800"
//               />
//               <Input
//                 type="text"
//                 placeholder="Add custom prompt (optional)"
//                 className="w-full mb-4 bg-white bg-opacity-50 text-gray-800"
//                 value={customPrompt}
//                 onChange={(e) => setCustomPrompt(e.target.value)}
//               />
//               <Button
//                 onClick={handleGenerate}
//                 disabled={!file || isLoading}
//                 className="w-full bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md transition duration-300 flex items-center justify-center"
//               >
//                 {isLoading ? 'Generating...' : 'Generate Documentation'}
//               </Button>
//             </div>
//           </div>
//         )}

//         {isLoading && (
//           <div className="absolute inset-0 bg-white bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-30">
//             <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
//           </div>
//         )}

//         {isGenerated && (
//           <>
//             <button
//               onClick={handleCopy}
//               className="absolute top-4 right-4 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-lg backdrop-blur-md bg-opacity-50 z-20 flex items-center justify-center"
//               title="Copy to Clipboard"
//               aria-label="Copy to Clipboard"
//             >
//               <FiCopy size={20} />
//             </button>

//             <button
//               onClick={handleReset}
//               className="absolute top-4 left-4 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg backdrop-blur-md bg-opacity-50 z-20 flex items-center justify-center"
//               title="Reset and Upload New Video"
//               aria-label="Reset and Upload New Video"
//             >
//               <FiRefreshCw size={20} />
//             </button>
//           </>
//         )}
//       </div>
//     </div>
//   )
// }




// // 'use client'

// // import React, { useState, useCallback } from 'react'
// // import '@uiw/react-md-editor/markdown-editor.css'
// // import '@uiw/react-markdown-preview/markdown.css'
// // import MDEditor from '@uiw/react-md-editor'
// // import rehypeSanitize from 'rehype-sanitize' // Import rehype-sanitize correctly
// // import { Button } from "@/components/ui/button"
// // import { Input } from "@/components/ui/input"
// // import { FiCopy, FiRefreshCw } from 'react-icons/fi' // Import icons from react-icons
// // import toast, { Toaster } from 'react-hot-toast' // For toast notifications

// // export default function DocumentationGenerator() {
// //   // --- State Variables ---
// //   const [file, setFile] = useState<File | null>(null)
// //   const [customPrompt, setCustomPrompt] = useState('')
// //   const [isLoading, setIsLoading] = useState(false)
// //   const [isGenerated, setIsGenerated] = useState(false)
// //   const [markdownContent, setMarkdownContent] = useState('# Your generated documentation')

// //   // --- Handle File Upload ---
// //   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
// //     if (e.target.files && e.target.files[0]) {
// //       setFile(e.target.files[0])
// //       setIsGenerated(false) // In case a new file is uploaded after a previous generation
// //     }
// //   }

// //   // --- Helper Functions for AWS Integration ---

// //   // 1. Get a presigned URL for uploading the video
// // const getPresignedUploadURL = async (file: File): Promise<{ uploadURL: string; key: string } | null> => {
// //   try {
// //     const response = await fetch('/api/get-presigned-url', {
// //       method: 'POST',
// //       // headers: {
// //       //   'Content-Type': 'application/json',
// //       // },
// //       body: JSON.stringify({
// //         fileName: file.name,
// //         fileType: file.type,
// //       }),
// //     })

// //     const data = await response.json()

// //     if (!response.ok) {
// //       // Log the full error response for debugging
// //       console.error('Error response from /api/get-presigned-url:', data)
// //       toast.error(data.message || 'Failed to get upload URL.')
// //       return null
// //     }

// //     if (!data.uploadURL || !data.key) {
// //       console.error('Invalid response data:', data)
// //       toast.error('Invalid response from server.')
// //       return null
// //     }

// //     return { uploadURL: data.uploadURL as string, key: data.key as string }
// //   } catch (error: any) {
// //     console.error('Error fetching presigned URL:', error)
// //     toast.error('An error occurred while getting the upload URL.')
// //     return null
// //   }
// // }


// //   // 2. Upload the file to S3 using the presigned URL
// //   const uploadFileToS3 = async (file: File, uploadURL: string): Promise<boolean> => {
// //     try {
// //       console.log('Uploading file to S3:', file.name)
// //       const response = await fetch(uploadURL, {
// //         method: 'PUT',
// //         // Remove or comment out the 'Content-Type' header
// //         // headers: {
// //         //   'Content-Type': file.type,
// //         // },
// //         body: file,
// //       })
  
// //       console.log('Upload response status:', response.status)
  
// //       if (!response.ok) {
// //         let errorMsg = `Upload failed with status ${response.status}`
// //         if (response.status === 403) {
// //           errorMsg = 'Upload failed: Forbidden. Check your permissions.'
// //         } else if (response.status === 400) {
// //           errorMsg = 'Upload failed: Bad Request.'
// //         }
// //         console.error(errorMsg)
// //         toast.error(errorMsg)
// //         return false
// //       }
  
// //       console.info('File uploaded to S3 successfully.')
// //       toast.success('File uploaded to S3 successfully!')
// //       return true
// //     } catch (error: any) {
// //       console.error('Error uploading file to S3:', error)
// //       toast.error('An error occurred during the file upload.')
// //       return false
// //     }
// //   }
  

// //   // 3. Fetch the presigned URL for the generated Markdown
// //   const getPresignedMarkdownURL = async (baseFileName: string): Promise<string | null> => {
// //     try {
// //       const response = await fetch('/api/get-generated-markdown-url', {
// //         method: 'POST',
// //         headers: {
// //           'Content-Type': 'application/json',
// //         },
// //         body: JSON.stringify({
// //           fileName: baseFileName,
// //         }),
// //       })

// //       if (!response.ok) {
// //         // Assuming that a non-200 status means the Markdown isn't ready yet
// //         return null
// //       }

// //       const data = await response.json()
// //       return data.markdownURL as string
// //     } catch (error) {
// //       console.error('Error fetching presigned Markdown URL:', error)
// //       return null
// //     }
// //   }


// //   // --- AWS-based Generate Documentation ---
// //   const handleGenerate = useCallback(async () => {
// //     if (!file) {
// //       toast.error('Please select a video file to upload.');
// //       return;
// //     }
  
// //     setIsLoading(true);
  
// //     // 1. Get a presigned URL for uploading the video
// //     const presignedData = await getPresignedUploadURL(file);
// //     if (!presignedData) {
// //       setIsLoading(false);
// //       return;
// //     }
  
// //     const { uploadURL, key } = presignedData;
  
// //     // 2. Upload the video to S3
// //     const uploadSuccess = await uploadFileToS3(file, uploadURL);
// //     if (!uploadSuccess) {
// //       setIsLoading(false);
// //       return;
// //     }
// //     toast.success('Video uploaded successfully! Video is being processed...');
  
// //     // 3. Extract baseFileName
// //     const baseFileName = key.split('/').pop()?.replace(/\.[^/.]+$/, '') || '';
  
// //     // 4. Extended Polling (3 minutes total)
// //     let attempts = 0;
// //     const maxAttempts = 36; // e.g. 36 attempts
// //     const pollInterval = 5000; // 5s intervals => 36 * 5s = 180s (~3 minutes)
  
// //     const pollForDoc = setInterval(async () => {
// //       attempts += 1;
// //       try {
// //         const markdownURL = await getPresignedMarkdownURL(baseFileName);
  
// //         if (markdownURL) {
// //           // Try fetching the .md from S3
// //           const markdownResponse = await fetch(markdownURL);
// //           if (markdownResponse.ok) {
// //             const markdown = await markdownResponse.text();
// //             setMarkdownContent(markdown);
// //             setIsGenerated(true);
// //             toast.success('Documentation generated successfully!');
// //             clearInterval(pollForDoc);
// //             setIsLoading(false);
// //           } else {
// //             // 404 or other error => doc isn't actually ready.
// //             console.warn(`Markdown present but fetch failed: ${markdownResponse.status}`);
// //             // Instead of stopping, keep polling until maxAttempts
// //             // If you prefer to stop immediately, uncomment below:
// //             // clearInterval(pollForDoc);
// //             // setIsLoading(false);
// //             // toast.error(`Failed to fetch doc: ${markdownResponse.status}`);
// //           }
// //         } else {
// //           // markdownURL === null => S3 returned 404 => doc not ready
// //           console.info(`Doc not ready. Attempt ${attempts}/${maxAttempts}`);
// //         }
// //       } catch (error) {
// //         console.error('Error fetching generated markdown:', error);
// //         // Optionally keep polling in case it's a transient error
// //       }
  
// //       if (attempts >= maxAttempts) {
// //         clearInterval(pollForDoc);
// //         setIsLoading(false);
// //         toast.error('Documentation took too long. Please try again later.');
// //       }
// //     }, pollInterval);
// //   }, [file]);
  


// //   // --- Copy Markdown to Clipboard ---
// //   const handleCopy = useCallback(() => {
// //     if (markdownContent.trim()) {
// //       navigator.clipboard.writeText(markdownContent)
// //         .then(() => {
// //           toast.success('Content copied to clipboard!')
// //         })
// //         .catch((err) => {
// //           toast.error('Failed to copy content.')
// //           console.error('Failed to copy:', err)
// //         })
// //     } else {
// //       toast.error('The document is empty. Nothing to copy.')
// //     }
// //   }, [markdownContent])

// //   // --- Reset State and Editor ---
// //   const handleReset = useCallback(() => {
// //     setFile(null)
// //     setCustomPrompt('')
// //     setIsGenerated(false)
// //     setMarkdownContent('# Your generated documentation')
// //     toast('You can upload a new video to generate documentation.', { icon: '🔄' })
// //   }, [])

// //   // --- Render ---
// //   return (
// //     <div className="relative w-full h-full min-h-screen flex items-center justify-center p-6">
// //       {/* Toast Notifications */}
// //       <Toaster position="top-right" />

// //       {/* Main Container with Glassmorphism */}
// //       <div className="relative w-full max-w-8xl h-[90vh] bg-white bg-opacity-20 backdrop-blur-lg border border-white border-opacity-30 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
// //         {/* Editor Section */
        
// //         <div className="flex-1 p-6 overflow-hidden">
// //           <MDEditor
// //             value={markdownContent}
// //             onChange={(value, event, state) => {
// //               setMarkdownContent(value ?? '');
// //             }}
// //             height={600} // Adjust height as needed
// //             previewOptions={{
// //               rehypePlugins: [rehypeSanitize], // Use the imported rehypeSanitize
// //             }}
// //             textareaProps={{
// //               placeholder: "Your generated documentation will appear here...",
// //             }}
// //             className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg p-2 h-full overflow-auto"
// //           />
// //         </div>
        
// //         }

// //         {/* Upload Overlay */}
// //         {!isGenerated && (
// //           <div className="absolute inset-0 bg-white bg-opacity-20 backdrop-blur-md z-10 flex items-center justify-center">
// //             <div className="bg-white bg-opacity-25 backdrop-blur-md p-8 rounded-xl shadow-lg z-20 border border-white border-opacity-20 w-full max-w-md mx-4">
// //               <h2 className="text-2xl font-bold text-center mb-6 text-[#0B4D4A]">Upload Screen Recording</h2>
// //               <Input
// //                 type="file"
// //                 accept="video/*"
// //                 onChange={handleFileChange}
// //                 className="w-full mb-4 bg-white bg-opacity-50 text-gray-800"
// //               />
// //               <Input
// //                 type="text"
// //                 placeholder="Add custom prompt (optional)"
// //                 className="w-full mb-4 bg-white bg-opacity-50 text-gray-800"
// //                 value={customPrompt}
// //                 onChange={(e) => setCustomPrompt(e.target.value)}
// //               />
// //               <Button
// //                 onClick={handleGenerate}
// //                 disabled={!file || isLoading}
// //                 className="w-full bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md transition duration-300 flex items-center justify-center"
// //               >
// //                 {isLoading ? 'Generating...' : 'Generate Documentation'}
// //               </Button>
// //             </div>
// //           </div>
// //         )}

// //         {/* Loading Spinner */}
// //         {isLoading && (
// //           <div className="absolute inset-0 bg-white bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-30">
// //             <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
// //           </div>
// //         )}

// //         {/* Copy and Reset Buttons */}
// //         {isGenerated && (
// //           <>
// //             {/* Copy Button */}
// //             <button
// //               onClick={handleCopy}
// //               className="absolute top-4 right-4 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-lg backdrop-blur-md bg-opacity-50 z-20 flex items-center justify-center"
// //               title="Copy to Clipboard"
// //               aria-label="Copy to Clipboard"
// //             >
// //               <FiCopy size={20} />
// //             </button>

// //             {/* Reset Button */}
// //             <button
// //               onClick={handleReset}
// //               className="absolute top-4 left-4 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg backdrop-blur-md bg-opacity-50 z-20 flex items-center justify-center"
// //               title="Reset and Upload New Video"
// //               aria-label="Reset and Upload New Video"
// //             >
// //               <FiRefreshCw size={20} />
// //             </button>
// //           </>
// //         )}
// //       </div>
// //     </div>
// //   )
// // }







// // // // // 'use client'

// // // // // import React, { useState, useCallback, useRef } from 'react'
// // // // // import SimpleMDE from 'react-simplemde-editor'
// // // // // import 'easymde/dist/easymde.min.css' // Import SimpleMDE CSS
// // // // // import { Button } from "@/components/ui/button"
// // // // // import { Input } from "@/components/ui/input"
// // // // // import { FiCopy } from 'react-icons/fi' // Import copy icon from react-icons
// // // // // import toast, { Toaster } from 'react-hot-toast' // For toast notifications

// // // // // export default function DocumentationGenerator() {
// //   // // // // State variables
// //   // // // const [file, setFile] = useState<File | null>(null)
// //   // // // const [customPrompt, setCustomPrompt] = useState('')
// //   // // // const [isLoading, setIsLoading] = useState(false)
// //   // // // const [isGenerated, setIsGenerated] = useState(false)

// //   // // // // Ref to store the SimpleMDE instance
// //   // // // const editorRef = useRef<SimpleMDE | null>(null)

// //   // // // // Handle file upload
// //   // // // const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
// //     // // // if (e.target.files && e.target.files[0]) {
// //       // // // setFile(e.target.files[0])
// //       // // // // Optionally, reset isGenerated if uploading a new file
// //       // // // setIsGenerated(false)
// //     // // // }
// //   // // // }

// //   // // // // Handle editor load to capture the SimpleMDE instance
// //   // // // const handleEditorLoad = useCallback((simpleMde: SimpleMDE) => {
// //     // // // console.log('SimpleMDE instance loaded:', simpleMde)
// //     // // // editorRef.current = simpleMde
// //   // // // }, [])

// //   // // // // Generate documentation by setting predefined markdown content
// //   // // // const handleGenerate = useCallback(() => {
// //     // // // setIsLoading(true)
// //     // // // setTimeout(() => {
// //       // // // if (editorRef.current) {
// //         // // // const generatedContent = `
// // // // // # Generated Documentation

// // // // // ## Introduction
// // // // // This is a sample documentation generated from your screen recording.

// // // // // ## Key Points
// // // // // 1. Point 1
// // // // // 2. Point 2
// // // // // 3. Point 3

// // // // // ## Conclusion
// // // // // This concludes the generated documentation. Please review and edit as needed.
// //         // // // `
// //         // // // console.log('Setting editor content:', generatedContent)
// //         // // // editorRef.current.value(generatedContent)
// //       // // // } else {
// //         // // // console.error('SimpleMDE instance is not available.')
// //         // // // toast.error('Failed to access the editor. Please try again.')
// //       // // // }
// //       // // // setIsLoading(false)
// //       // // // setIsGenerated(true) // Hide the upload overlay
// //       // // // toast.success('Documentation generated successfully!')
// //     // // // }, 2000) // Simulating a 2-second delay
// //   // // // }, [])

// //   // // // // Copy content to clipboard
// //   // // // const handleCopy = useCallback(() => {
// //     // // // if (editorRef.current) {
// //       // // // const content = editorRef.current.value()
// //       // // // if (!content.trim()) {
// //         // // // toast.error('The document is empty. Nothing to copy.')
// //         // // // return
// //       // // // }
// //       // // // navigator.clipboard.writeText(content)
// //         // // // .then(() => {
// //           // // // toast.success('Content copied to clipboard!')
// //         // // // })
// //         // // // .catch((err) => {
// //           // // // toast.error('Failed to copy content.')
// //           // // // console.error('Failed to copy:', err)
// //         // // // })
// //     // // // } else {
// //       // // // toast.error('Editor instance not found.')
// //     // // // }
// //   // // // }, [])

// //   // // // // Reset the editor and state to allow uploading a new video
// //   // // // const handleReset = useCallback(() => {
// //     // // // setFile(null)
// //     // // // setCustomPrompt('')
// //     // // // setIsGenerated(false)
// //     // // // if (editorRef.current) {
// //       // // // editorRef.current.value('# Your generated documentation')
// //     // // // }
// //     // // // toast('You can upload a new video to generate documentation.', { icon: '🔄' })
// //   // // // }, [])

// //   // // // return (
// //     // // // <div className="relative w-full h-full min-h-screen bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 flex items-center justify-center p-6">
// //       // // // {/* Toast Notifications */}
// //       // // // <Toaster position="top-right" />

// //       // // // {/* Main Container with Glassmorphism */}
// //       // // // <div className="relative w-full max-w-4xl h-[80vh] bg-white bg-opacity-20 backdrop-blur-lg border border-white border-opacity-30 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
// //         // // // {/* Editor Section */}
// //         // // // <div className="flex-1 p-6 overflow-hidden">
// //           // // // <SimpleMDE
// //             // // // onLoad={handleEditorLoad}
// //             // // // defaultValue="# Your generated documentation"
// //             // // // options={{
// //               // // // spellChecker: false,
// //               // // // placeholder: "Your generated documentation will appear here...",
// //               // // // toolbar: ["bold", "italic", "heading", "|", "quote", "unordered-list", "ordered-list", "|", "link", "image", "|", "preview"],
// //               // // // status: false,
// //               // // // autosave: {
// //                 // // // enabled: false,
// //               // // // },
// //               // // // autofocus: false, // Prevent automatic focus to avoid conflict
// //             // // // }}
// //             // // // className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg p-2 h-full overflow-auto"
// //           // // // />
// //         // // // </div>

// //         // // // {/* Upload Overlay */}
// //         // // // {!isGenerated && (
// //           // // // <div className="absolute inset-0 bg-white bg-opacity-30 backdrop-blur-md z-10 flex items-center justify-center">
// //             // // // <div className="bg-white bg-opacity-25 backdrop-blur-md p-8 rounded-xl shadow-lg z-20 border border-white border-opacity-20 w-full max-w-md mx-4">
// //               // // // <h2 className="text-2xl font-bold text-center mb-6 text-white">Upload Screen Recording</h2>
// //               // // // <Input
// //                 // // // type="file"
// //                 // // // accept="video/*"
// //                 // // // onChange={handleFileChange}
// //                 // // // className="w-full mb-4 bg-white bg-opacity-50 text-gray-800"
// //               // // // />
// //               // // // <Input
// //                 // // // type="text"
// //                 // // // placeholder="Add custom prompt (optional)"
// //                 // // // className="w-full mb-4 bg-white bg-opacity-50 text-gray-800"
// //                 // // // value={customPrompt}
// //                 // // // onChange={(e) => setCustomPrompt(e.target.value)}
// //               // // // />
// //               // // // <Button
// //                 // // // onClick={handleGenerate}
// //                 // // // disabled={!file || isLoading}
// //                 // // // className="w-full bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md transition duration-300 flex items-center justify-center"
// //               // // // >
// //                 // // // {isLoading ? 'Generating...' : 'Generate Documentation'}
// //               // // // </Button>
// //             // // // </div>
// //           // // // </div>
// //         // // // )}

// //         // // // {/* Loading Spinner */}
// //         // // // {isLoading && (
// //           // // // <div className="absolute inset-0 bg-white bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-30">
// //             // // // <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
// //           // // // </div>
// //         // // // )}

// //         // // // {/* Copy Button */}
// //         // // // {isGenerated && (
// //           // // // <button
// //             // // // onClick={handleCopy}
// //             // // // className="absolute top-4 right-4 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-lg backdrop-blur-md bg-opacity-50 z-20"
// //             // // // title="Copy to Clipboard"
// //             // // // aria-label="Copy to Clipboard"
// //           // // // >
// //             // // // <FiCopy size={20} />
// //           // // // </button>
// //         // // // )}

// //         // // // {/* Reset Button */}
// //         // // // {isGenerated && (
// //           // // // <button
// //             // // // onClick={handleReset}
// //             // // // className="absolute top-4 left-4 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg backdrop-blur-md bg-opacity-50 z-20"
// //             // // // title="Reset and Upload New Video"
// //             // // // aria-label="Reset and Upload New Video"
// //           // // // >
// //             // // // {/* Reset Icon */}
// //             // // // <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
// //               // // // <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 114.582 9m0 0H9" />
// //             // // // </svg>
// //           // // // </button>
// //         // // // )}
// //       // // // </div>
// //     // // // </div>
// //   // // // )
// // // // // }


// // // 'use client'

// // // import React, { useState, useCallback } from 'react'
// // // import dynamic from 'next/dynamic' // Only if you're using Next.js
// // // import '@uiw/react-md-editor/markdown-editor.css'
// // // import '@uiw/react-markdown-preview/markdown.css'
// // // import MDEditor from '@uiw/react-md-editor'
// // // import rehypeSanitize from 'rehype-sanitize' // Import rehype-sanitize correctly
// // // import { Button } from "@/components/ui/button"
// // // import { Input } from "@/components/ui/input"
// // // import { FiCopy, FiRefreshCw } from 'react-icons/fi' // Import icons from react-icons
// // // import toast, { Toaster } from 'react-hot-toast' // For toast notifications

// // // export default function DocumentationGenerator() {
// //   // // State variables
// //   // const [file, setFile] = useState<File | null>(null)
// //   // const [customPrompt, setCustomPrompt] = useState('')
// //   // const [isLoading, setIsLoading] = useState(false)
// //   // const [isGenerated, setIsGenerated] = useState(false)
// //   // const [markdownContent, setMarkdownContent] = useState('# Your generated documentation')

// //   // // Handle file upload
// //   // const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
// //     // if (e.target.files && e.target.files[0]) {
// //       // setFile(e.target.files[0])
// //       // // Optionally, reset isGenerated if uploading a new file
// //       // setIsGenerated(false)
// //     // }
// //   // }

// //   // // Generate documentation by setting predefined markdown content
// //   // const handleGenerate = useCallback(() => {
// //     // setIsLoading(true)
// //     // setTimeout(() => {
// //       // const generatedContent = `
// // // # Generated Documentation

// // // ## Introduction
// // // This is a sample documentation generated from your screen recording.

// // // ## Key Points
// // // 1. Point 1
// // // 2. Point 2
// // // 3. Point 3

// // // ## Conclusion
// // // This concludes the generated documentation. Please review and edit as needed.
// //       // `
// //       // setMarkdownContent(generatedContent)
// //       // setIsLoading(false)
// //       // setIsGenerated(true) // Hide the upload overlay
// //       // toast.success('Documentation generated successfully!')
// //     // }, 2000) // Simulating a 2-second delay
// //   // }, [])

// //   // // Copy content to clipboard
// //   // const handleCopy = useCallback(() => {
// //     // if (markdownContent.trim()) {
// //       // navigator.clipboard.writeText(markdownContent)
// //         // .then(() => {
// //           // toast.success('Content copied to clipboard!')
// //         // })
// //         // .catch((err) => {
// //           // toast.error('Failed to copy content.')
// //           // console.error('Failed to copy:', err)
// //         // })
// //     // } else {
// //       // toast.error('The document is empty. Nothing to copy.')
// //     // }
// //   // }, [markdownContent])

// //   // // Reset the editor and state to allow uploading a new video
// //   // const handleReset = useCallback(() => {
// //     // setFile(null)
// //     // setCustomPrompt('')
// //     // setIsGenerated(false)
// //     // setMarkdownContent('# Your generated documentation')
// //     // toast('You can upload a new video to generate documentation.', { icon: '🔄' })
// //   // }, [])

// //   // return (
// //     // <div className="relative w-full h-full min-h-screen flex items-center justify-center p-6">
// //       // {/* Toast Notifications */}
// //       // <Toaster position="top-right" />

// //       // {/* Main Container with Glassmorphism */}
// //       // <div className="relative w-full max-w-4xl h-[90vh] bg-white bg-opacity-20 backdrop-blur-lg border border-white border-opacity-30 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
// //         // {/* Editor Section */}
// //         // <div className="flex-1 p-6 overflow-hidden">
// //           // <MDEditor
// //             // value={markdownContent}
// //             // onChange={setMarkdownContent}
// //             // height={600} // Adjust height as needed
// //             // previewOptions={{
// //               // rehypePlugins: [rehypeSanitize] // Use the imported rehypeSanitize
// //             // }}
// //             // textareaProps={{
// //               // placeholder: "Your generated documentation will appear here...",
// //             // }}
// //             // className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg p-2 h-full overflow-auto"
// //           // />
// //         // </div>

// //         // {/* Upload Overlay */}
// //         // {!isGenerated && (
// //           // <div className="absolute inset-0 bg-white bg-opacity-20 backdrop-blur-md z-10 flex items-center justify-center">
// //             // <div className="bg-white bg-opacity-25 backdrop-blur-md p-8 rounded-xl shadow-lg z-20 border border-white border-opacity-20 w-full max-w-md mx-4">
// //               // <h2 className="text-2xl font-bold text-center mb-6 text-[#0B4D4A]">Upload Screen Recording</h2>
// //               // <Input
// //                 // type="file"
// //                 // accept="video/*"
// //                 // onChange={handleFileChange}
// //                 // className="w-full mb-4 bg-white bg-opacity-50 text-gray-800"
// //               // />
// //               // <Input
// //                 // type="text"
// //                 // placeholder="Add custom prompt (optional)"
// //                 // className="w-full mb-4 bg-white bg-opacity-50 text-gray-800"
// //                 // value={customPrompt}
// //                 // onChange={(e) => setCustomPrompt(e.target.value)}
// //               // />
// //               // <Button
// //                 // onClick={handleGenerate}
// //                 // disabled={!file || isLoading}
// //                 // className="w-full bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md transition duration-300 flex items-center justify-center"
// //               // >
// //                 // {isLoading ? 'Generating...' : 'Generate Documentation'}
// //               // </Button>
// //             // </div>
// //           // </div>
// //         // )}

// //         // {/* Loading Spinner */}
// //         // {isLoading && (
// //           // <div className="absolute inset-0 bg-white bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-30">
// //             // <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
// //           // </div>
// //         // )}

// //         // {/* Copy and Reset Buttons */}
// //         // {isGenerated && (
// //           // <>
// //             // {/* Copy Button */}
// //             // <button
// //               // onClick={handleCopy}
// //               // className="absolute top-4 right-4 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-lg backdrop-blur-md bg-opacity-50 z-20 flex items-center justify-center"
// //               // title="Copy to Clipboard"
// //               // aria-label="Copy to Clipboard"
// //             // >
// //               // <FiCopy size={20} />
// //             // </button>

// //             // {/* Reset Button */}
// //             // <button
// //               // onClick={handleReset}
// //               // className="absolute top-4 left-4 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg backdrop-blur-md bg-opacity-50 z-20 flex items-center justify-center"
// //               // title="Reset and Upload New Video"
// //               // aria-label="Reset and Upload New Video"
// //             // >
// //               // <FiRefreshCw size={20} />
// //             // </button>
// //           // </>
// //         // )}
// //       // </div>
// //     // </div>
// //   // )
// // // }

// // // import React, { useState, useCallback } from 'react'
// // // import MDEditor from '@uiw/react-md-editor'
// // // import rehypeSanitize from 'rehype-sanitize'
// // // import { Button } from "@/components/ui/button"
// // // import { Input } from "@/components/ui/input"
// // // import { FiCopy, FiRefreshCw } from 'react-icons/fi' // Import icons from react-icons
// // // import toast, { Toaster } from 'react-hot-toast' // For toast notifications

// // // export default function DocumentationGenerator() {
// //   // // State variables
// //   // const [file, setFile] = useState<File | null>(null)
// //   // const [customPrompt, setCustomPrompt] = useState('')
// //   // const [isLoading, setIsLoading] = useState(false)
// //   // const [isGenerated, setIsGenerated] = useState(false)
// //   // const [markdownContent, setMarkdownContent] = useState('# Your generated documentation')

// //   // // Handle file upload input change
// //   // const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
// //     // if (e.target.files && e.target.files[0]) {
// //       // setFile(e.target.files[0])
// //       // setIsGenerated(false)
// //     // }
// //   // }

// //   // // Function to get presigned upload URL from backend
// //   // const getPresignedUploadURL = async (file: File): Promise<string | null> => {
// //     // try {
// //       // const response = await fetch('/api/get-presigned-url', {
// //         // method: 'POST',
// //         // headers: {
// //           // 'Content-Type': 'application/json'
// //         // },
// //         // body: JSON.stringify({
// //           // fileName: file.name,
// //           // fileType: file.type
// //         // })
// //       // })

// //       // const data = await response.json()

// //       // if (response.ok) {
// //         // return data.uploadURL
// //       // } else {
// //         // toast.error(data.message || 'Failed to get upload URL.')
// //         // return null
// //       // }
// //     // } catch (error) {
// //       // console.error('Error fetching presigned URL:', error)
// //       // toast.error('An error occurred while getting the upload URL.')
// //       // return null
// //     // }
// //   // }

// //   // // Function to upload file to S3 using presigned URL
// //   // const uploadFileToS3 = async (file: File, uploadURL: string): Promise<boolean> => {
// //     // try {
// //       // const response = await fetch(uploadURL, {
// //         // method: 'PUT',
// //         // headers: {
// //           // 'Content-Type': file.type
// //         // },
// //         // body: file
// //       // })

// //       // if (response.ok) {
// //         // return true
// //       // } else {
// //         // toast.error('Failed to upload the file.')
// //         // return false
// //       // }
// //     // } catch (error) {
// //       // console.error('Error uploading file:', error)
// //       // toast.error('An error occurred during the file upload.')
// //       // return false
// //     // }
// //   // }

// //   // // Handle Generate Documentation
// //   // const handleGenerate = useCallback(async () => {
// //     // if (!file) {
// //       // toast.error('Please select a video file to upload.')
// //       // return
// //     // }

// //     // setIsLoading(true)

// //     // // Step 1: Get presigned upload URL
// //     // const uploadURL = await getPresignedUploadURL(file)

// //     // if (!uploadURL) {
// //       // setIsLoading(false)
// //       // return
// //     // }

// //     // // Step 2: Upload the file to S3
// //     // const uploadSuccess = await uploadFileToS3(file, uploadURL)

// //     // if (!uploadSuccess) {
// //       // setIsLoading(false)
// //       // return
// //     // }

// //     // toast.success('Video uploaded successfully!')

// //     // // The Lambda function 'doc-generator' will be triggered by S3 upload event
// //     // // and should process the video to generate documentation.
// //     // // Assuming the Lambda function sends back a presigned URL with the markdown content.

// //     // // For demonstration, we'll simulate fetching the markdown content
// //     // // Replace this with actual logic to retrieve the presigned URL from your backend or notification.

// //     // // Simulating a delay for processing
// //     // setTimeout(async () => {
// //       // try {
// //         // // Step 3: Fetch the presigned URL for the generated markdown
// //         // const response = await fetch('/api/get-generatedmarkdown-url', {
// //           // method: 'POST',
// //           // headers: {
// //             // 'Content-Type': 'application/json'
// //           // },
// //           // body: JSON.stringify({
// //             // fileName: file.name.replace(/\.[^/.]+$/, "") + '.md' // Assuming markdown file has same name
// //           // })
// //         // })

// //         // const data = await response.json()

// //         // if (response.ok) {
// //           // const markdownURL = data.markdownURL

// //           // // Step 4: Fetch the markdown content from the presigned URL
// //           // const markdownResponse = await fetch(markdownURL)

// //           // if (markdownResponse.ok) {
// //             // const markdown = await markdownResponse.text()
// //             // setMarkdownContent(markdown)
// //             // setIsGenerated(true)
// //             // toast.success('Documentation generated successfully!')
// //           // } else {
// //             // toast.error('Failed to fetch the generated documentation.')
// //           // }
// //         // } else {
// //           // toast.error(data.message || 'Failed to get the markdown URL.')
// //         // }
// //       // } catch (error) {
// //         // console.error('Error fetching markdown content:', error)
// //         // toast.error('An error occurred while fetching the documentation.')
// //       // }

// //       // setIsLoading(false)
// //     // }, 5000) // Simulating a 5-second processing time
// //   // }, [file])

// //   // // Copy content to clipboard
// //   // const handleCopy = useCallback(() => {
// //     // if (markdownContent.trim()) {
// //       // navigator.clipboard.writeText(markdownContent)
// //         // .then(() => {
// //           // toast.success('Content copied to clipboard!')
// //         // })
// //         // .catch((err) => {
// //           // toast.error('Failed to copy content.')
// //           // console.error('Failed to copy:', err)
// //         // })
// //     // } else {
// //       // toast.error('The document is empty. Nothing to copy.')
// //     // }
// //   // }, [markdownContent])

// //   // // Reset the editor and state to allow uploading a new video
// //   // const handleReset = useCallback(() => {
// //     // setFile(null)
// //     // setCustomPrompt('')
// //     // setIsGenerated(false)
// //     // setMarkdownContent('# Your generated documentation')
// //     // toast('You can upload a new video to generate documentation.', { icon: '🔄' })
// //   // }, [])

// //   // return (
// //     // <div className="relative w-full h-full min-h-screen bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 flex items-center justify-center p-6">
// //       // {/* Toast Notifications */}
// //       // <Toaster position="top-right" />

// //       // {/* Main Container with Glassmorphism */}
// //       // <div className="relative w-full max-w-4xl h-[80vh] bg-white bg-opacity-20 backdrop-blur-lg border border-white border-opacity-30 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
// //         // {/* Editor Section */}
// //         // <div className="flex-1 p-6 overflow-hidden">
// //           // <MDEditor
// //             // value={markdownContent}
// //             // onChange={setMarkdownContent}
// //             // height={400} // Adjust height as needed
// //             // previewOptions={{
// //               // rehypePlugins: [rehypeSanitize] // Sanitize the markdown content
// //             // }}
// //             // textareaProps={{
// //               // placeholder: "Your generated documentation will appear here...",
// //             // }}
// //             // className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg p-2 h-full overflow-auto"
// //           // />
// //         // </div>

// //         // {/* Upload Overlay */}
// //         // {!isGenerated && (
// //           // <div className="absolute inset-0 bg-white bg-opacity-30 backdrop-blur-md z-10 flex items-center justify-center">
// //             // <div className="bg-white bg-opacity-25 backdrop-blur-md p-8 rounded-xl shadow-lg z-20 border border-white border-opacity-20 w-full max-w-md mx-4">
// //               // <h2 className="text-2xl font-bold text-center mb-6 text-white">Upload Screen Recording</h2>
// //               // <Input
// //                 // type="file"
// //                 // accept="video/*"
// //                 // onChange={handleFileChange}
// //                 // className="w-full mb-4 bg-white bg-opacity-50 text-gray-800"
// //               // />
// //               // <Input
// //                 // type="text"
// //                 // placeholder="Add custom prompt (optional)"
// //                 // className="w-full mb-4 bg-white bg-opacity-50 text-gray-800"
// //                 // value={customPrompt}
// //                 // onChange={(e) => setCustomPrompt(e.target.value)}
// //               // />
// //               // <Button
// //                 // onClick={handleGenerate}
// //                 // disabled={!file || isLoading}
// //                 // className="w-full bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md transition duration-300 flex items-center justify-center"
// //               // >
// //                 // {isLoading ? 'Generating...' : 'Generate Documentation'}
// //               // </Button>
// //             // </div>
// //           // </div>
// //         // )}

// //         // {/* Loading Spinner */}
// //         // {isLoading && (
// //           // <div className="absolute inset-0 bg-white bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-30">
// //             // <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
// //           // </div>
// //         // )}

// //         // {/* Copy and Reset Buttons */}
// //         // {isGenerated && (
// //           // <>
// //             // {/* Copy Button */}
// //             // <button
// //               // onClick={handleCopy}
// //               // className="absolute top-4 right-4 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-lg backdrop-blur-md bg-opacity-50 z-20 flex items-center justify-center"
// //               // title="Copy to Clipboard"
// //               // aria-label="Copy to Clipboard"
// //             // >
// //               // <FiCopy size={20} />
// //             // </button>

// //             // {/* Reset Button */}
// //             // <button
// //               // onClick={handleReset}
// //               // className="absolute top-4 left-4 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg backdrop-blur-md bg-opacity-50 z-20 flex items-center justify-center"
// //               // title="Reset and Upload New Video"
// //               // aria-label="Reset and Upload New Video"
// //             // >
// //               // <FiRefreshCw size={20} />
// //             // </button>
// //           // </>
// //         // )}
// //       // </div>
// //     // </div>
// //   // )
// // // }

// // // 'use client'

// // // import React, { useState, useCallback } from 'react'
// // // import dynamic from 'next/dynamic' // Only if you're using Next.js
// // // import '@uiw/react-md-editor/markdown-editor.css'
// // // import '@uiw/react-markdown-preview/markdown.css'
// // // import MDEditor from '@uiw/react-md-editor'
// // // import rehypeSanitize from 'rehype-sanitize' // Import rehype-sanitize correctly
// // // import { Button } from "@/components/ui/button"
// // // import { Input } from "@/components/ui/input"
// // // import { FiCopy, FiRefreshCw } from 'react-icons/fi' // Import icons from react-icons
// // // import toast, { Toaster } from 'react-hot-toast' // For toast notifications

// // // export default function DocumentationGenerator() {
// //   // // --- State Variables ---
// //   // const [file, setFile] = useState<File | null>(null)
// //   // const [customPrompt, setCustomPrompt] = useState('')
// //   // const [isLoading, setIsLoading] = useState(false)
// //   // const [isGenerated, setIsGenerated] = useState(false)
// //   // const [markdownContent, setMarkdownContent] = useState('# Your generated documentation')

// //   // // --- Handle File Upload ---
// //   // const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
// //     // if (e.target.files && e.target.files[0]) {
// //       // setFile(e.target.files[0])
// //       // setIsGenerated(false) // In case a new file is uploaded after a previous generation
// //     // }
// //   // }

// //   // // --- Helper Functions for AWS Integration ---

// //   // // 1. Get a presigned URL for uploading the video
// //   // const getPresignedUploadURL = async (file: File): Promise<string | null> => {
// //     // try {
// //       // const response = await fetch('/api/get-presigned-url', {
// //         // method: 'POST',
// //         // headers: {
// //           // 'Content-Type': 'application/json',
// //         // },
// //         // body: JSON.stringify({
// //           // fileName: file.name,
// //           // fileType: file.type,
// //         // }),
// //       // })

// //       // if (!response.ok) {
// //         // const errorData = await response.json()
// //         // toast.error(errorData.message || 'Failed to get upload URL.')
// //         // return null
// //       // }

// //       // const data = await response.json()
// //       // return data.uploadURL as string
// //     // } catch (error) {
// //       // console.error('Error fetching presigned URL:', error)
// //       // toast.error('An error occurred while getting the upload URL.')
// //       // return null
// //     // }
// //   // }

// //   // // 2. Upload the file to S3 using the presigned URL
// //   // const uploadFileToS3 = async (file: File, uploadURL: string): Promise<boolean> => {
// //     // try {
// //       // const response = await fetch(uploadURL, {
// //         // method: 'PUT',
// //         // headers: {
// //           // 'Content-Type': file.type,
// //         // },
// //         // body: file,
// //       // })

// //       // if (!response.ok) {
// //         // toast.error('Failed to upload the file to S3.')
// //         // return false
// //       // }

// //       // return true
// //     // } catch (error) {
// //       // console.error('Error uploading file to S3:', error)
// //       // toast.error('An error occurred during the file upload.')
// //       // return false
// //     // }
// //   // }

// //   // // --- AWS-based Generate Documentation ---
// //   // const handleGenerate = useCallback(async () => {
// //     // if (!file) {
// //       // toast.error('Please select a video file to upload.')
// //       // return
// //     // }

// //     // setIsLoading(true)

// //     // // 1. Get a presigned URL for uploading the video
// //     // const uploadURL = await getPresignedUploadURL(file)
// //     // if (!uploadURL) {
// //       // setIsLoading(false)
// //       // return
// //     // }

// //     // // 2. Upload the video to S3
// //     // const uploadSuccess = await uploadFileToS3(file, uploadURL)
// //     // if (!uploadSuccess) {
// //       // setIsLoading(false)
// //       // return
// //     // }
// //     // toast.success('Video uploaded successfully! Video is being processed...')

// //     // // 3. Poll for the generated documentation (or you can implement a WebSocket or SNS/SQS)
// //     // //    For simplicity, we'll just simulate waiting for the doc to be ready, then fetch it.

// //     // let attempts = 0
// //     // const maxAttempts = 12 // Wait up to ~1 minute
// //     // const pollInterval = 5000 // Check every 5 seconds

// //     // const pollForDoc = setInterval(async () => {
// //       // attempts += 1
// //       // try {
// //         // // This is an example endpoint to get the presigned URL for the generated doc
// //         // // The name below (without extension) should match how Lambda saves the doc
// //         // const response = await fetch('/api/get-generatedmarkdown-url', {
// //           // method: 'POST',
// //           // headers: {
// //             // 'Content-Type': 'application/json',
// //           // },
// //           // body: JSON.stringify({
// //             // fileName: file.name.replace(/\.[^/.]+$/, ''), // file name without extension
// //           // }),
// //         // })

// //         // if (response.ok) {
// //           // const data = await response.json()
// //           // const markdownURL = data.markdownURL
// //           // if (markdownURL) {
// //             // // Fetch the generated markdown from S3
// //             // const markdownResponse = await fetch(markdownURL)
// //             // if (markdownResponse.ok) {
// //               // const markdown = await markdownResponse.text()
// //               // setMarkdownContent(markdown)
// //               // setIsGenerated(true)
// //               // toast.success('Documentation generated successfully!')

// //               // clearInterval(pollForDoc)
// //               // setIsLoading(false)
// //             // } else {
// //               // toast.error('Failed to fetch generated documentation.')
// //               // clearInterval(pollForDoc)
// //               // setIsLoading(false)
// //             // }
// //           // } else {
// //             // // If the doc isn't ready yet, do nothing; the next poll attempt will continue
// //           // }
// //         // } else {
// //           // // If not found or not ready yet, keep polling
// //         // }
// //       // } catch (error) {
// //         // console.error('Error fetching generated markdown:', error)
// //         // // We keep polling until attempts are exhausted
// //       // }

// //       // if (attempts >= maxAttempts) {
// //         // // If the doc is still not ready after maxAttempts, stop polling
// //         // clearInterval(pollForDoc)
// //         // setIsLoading(false)
// //         // toast.error('Documentation generation took too long. Please try again later.')
// //       // }
// //     // }, pollInterval)
// //   // }, [file])

// //   // // --- Copy Markdown to Clipboard ---
// //   // const handleCopy = useCallback(() => {
// //     // if (markdownContent.trim()) {
// //       // navigator.clipboard.writeText(markdownContent)
// //         // .then(() => {
// //           // toast.success('Content copied to clipboard!')
// //         // })
// //         // .catch((err) => {
// //           // toast.error('Failed to copy content.')
// //           // console.error('Failed to copy:', err)
// //         // })
// //     // } else {
// //       // toast.error('The document is empty. Nothing to copy.')
// //     // }
// //   // }, [markdownContent])

// //   // // --- Reset State and Editor ---
// //   // const handleReset = useCallback(() => {
// //     // setFile(null)
// //     // setCustomPrompt('')
// //     // setIsGenerated(false)
// //     // setMarkdownContent('# Your generated documentation')
// //     // toast('You can upload a new video to generate documentation.', { icon: '🔄' })
// //   // }, [])

// //   // // --- Render ---
// //   // return (
// //     // <div className="relative w-full h-full min-h-screen flex items-center justify-center p-6">
// //       // {/* Toast Notifications */}
// //       // <Toaster position="top-right" />

// //       // {/* Main Container with Glassmorphism */}
// //       // <div className="relative w-full max-w-4xl h-[90vh] bg-white bg-opacity-20 backdrop-blur-lg border border-white border-opacity-30 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
// //         // {/* Editor Section */}
// //         // <div className="flex-1 p-6 overflow-hidden">
// //           // <MDEditor
// //             // value={markdownContent}
// //             // onChange={setMarkdownContent}
// //             // height={600} // Adjust height as needed
// //             // previewOptions={{
// //               // rehypePlugins: [rehypeSanitize], // Use the imported rehypeSanitize
// //             // }}
// //             // textareaProps={{
// //               // placeholder: "Your generated documentation will appear here...",
// //             // }}
// //             // className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg p-2 h-full overflow-auto"
// //           // />
// //         // </div>

// //         // {/* Upload Overlay */}
// //         // {!isGenerated && (
// //           // <div className="absolute inset-0 bg-white bg-opacity-20 backdrop-blur-md z-10 flex items-center justify-center">
// //             // <div className="bg-white bg-opacity-25 backdrop-blur-md p-8 rounded-xl shadow-lg z-20 border border-white border-opacity-20 w-full max-w-md mx-4">
// //               // <h2 className="text-2xl font-bold text-center mb-6 text-[#0B4D4A]">Upload Screen Recording</h2>
// //               // <Input
// //                 // type="file"
// //                 // accept="video/*"
// //                 // onChange={handleFileChange}
// //                 // className="w-full mb-4 bg-white bg-opacity-50 text-gray-800"
// //               // />
// //               // <Input
// //                 // type="text"
// //                 // placeholder="Add custom prompt (optional)"
// //                 // className="w-full mb-4 bg-white bg-opacity-50 text-gray-800"
// //                 // value={customPrompt}
// //                 // onChange={(e) => setCustomPrompt(e.target.value)}
// //               // />
// //               // <Button
// //                 // onClick={handleGenerate}
// //                 // disabled={!file || isLoading}
// //                 // className="w-full bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md transition duration-300 flex items-center justify-center"
// //               // >
// //                 // {isLoading ? 'Generating...' : 'Generate Documentation'}
// //               // </Button>
// //             // </div>
// //           // </div>
// //         // )}

// //         // {/* Loading Spinner */}
// //         // {isLoading && (
// //           // <div className="absolute inset-0 bg-white bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-30">
// //             // <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
// //           // </div>
// //         // )}

// //         // {/* Copy and Reset Buttons */}
// //         // {isGenerated && (
// //           // <>
// //             // {/* Copy Button */}
// //             // <button
// //               // onClick={handleCopy}
// //               // className="absolute top-4 right-4 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-lg backdrop-blur-md bg-opacity-50 z-20 flex items-center justify-center"
// //               // title="Copy to Clipboard"
// //               // aria-label="Copy to Clipboard"
// //             // >
// //               // <FiCopy size={20} />
// //             // </button>

// //             // {/* Reset Button */}
// //             // <button
// //               // onClick={handleReset}
// //               // className="absolute top-4 left-4 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg backdrop-blur-md bg-opacity-50 z-20 flex items-center justify-center"
// //               // title="Reset and Upload New Video"
// //               // aria-label="Reset and Upload New Video"
// //             // >
// //               // <FiRefreshCw size={20} />
// //             // </button>
// //           // </>
// //         // )}
// //       // </div>
// //     // </div>
// //   // )
// // // }

