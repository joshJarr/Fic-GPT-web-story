import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Home() {
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [loadingContent, setLoadingContent] = useState(false);
  const [loadingImage, setLoadingImage] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [title, setTitle] = useState('');
  const [currentTimelineEventId, setCurrentTimelineEventId] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState('');
  const [links, setLinks] = useState([]);
  const [noAi, setNoAi] = useState(false);
  const [summarizingHistory, setSummarizingHistory] = useState(false);

  // Message history count until we need to summarize the story.
  const STORY_SUMMARY_LIMIT = 20;

  const resetUser = () => {
    // Remove current user
    localStorage.removeItem('userId');
    localStorage.removeItem('messages');
    // Refresh the page
    location.reload();
  };

  const renderEvent = (currentEvent) => {
    setCurrentTimelineEventId(currentEvent.id);
    setTitle(currentEvent.narrative_event_title);
    setDescription(currentEvent.narrative_event_description);
    setLinks(currentEvent.links);

    setLoadingEvent(false);
  };

  const renderImage = (imageUrl) => {
    setImage(imageUrl);
    setLoadingImage(false);
  };

  const renderText = (message) => {
    const text = message
    setContent(text);
    setLoadingContent(false);
  };

  // Take the first X messages and summaries them
  const summariesStoryMessages = async (messages) => {
    setSummarizingHistory(true);
    const amountMessagesToSummarize = messages.length;
    const assistantMessages = messages.filter((message) => (message.role === 'assistant' || message.role === 'system'))

    if (assistantMessages.length === 0) {
      console.error('No assistant messages found in message history.')
      errorMessage(`Error: Unable to summaries story, see console for details.`)
    }

    const assistantMessageContent = assistantMessages.map((message) => message.content).join('\n\n');

    try {
      const summaryResponse = await axios.post(`/api/summaries-story`, {story: assistantMessageContent});
      const summary = summaryResponse.data.summary;

      const summaryMessage = {
        "role": "system",
        "content": `Summary of the next part of the story:
        ${summary}`
      };

      let messageHistory = JSON.parse(localStorage.getItem('messages'));
      messageHistory.splice(0, amountMessagesToSummarize, summaryMessage);

      localStorage.setItem('messages', JSON.stringify(messageHistory));
    } catch (error) {
      setErrorMessage(`Error: Unable to progress story, see console for details.`)
      throw error;
    }
    setSummarizingHistory(false);
  }



  const storeMessageHistory = (role, content) => {
    let messages = localStorage.getItem('messages');
    messages = messages ? JSON.parse(messages) : [];
    messages.push({role, content});

    if (messages.length > STORY_SUMMARY_LIMIT && !summarizingHistory) {
      summariesStoryMessages(messages);
    }

    localStorage.setItem('messages', JSON.stringify(messages));
  }

  const followLink = async (link) => {
    setLoadingEvent(true);

    let userId = localStorage.getItem('userId');

    let isNewUser = false;

    if (!userId) {
      // Generate a new user ID.
      userId = "id" + Math.random().toString(16).slice(2)
      // Set the ID in local storage.
      localStorage.setItem('userId', userId);
      localStorage.removeItem('messages');
      isNewUser = true;
    }

    const data = {
      user: userId,
      linkToFollow: link?.id || null,
      currentTimelineEvent: currentTimelineEventId || null,
      isNewUser,
    }

    // render event data.
    let event;
    try {
      event = await axios.post(`/api/follow-link`, data);
      event = event.data.event
      renderEvent(event)
    } catch (error) {
      setErrorMessage(`Error: Unable to progress story, see console for details.`)
      throw error;
    }

    if (event.narrative_event_title === 'The end') {
      setLoadingContent(true);
      let messages = localStorage.getItem('messages');
      await summariesStoryMessages(JSON.parse(messages));
      setTimeout(() => {
        const finalStoryMessages = JSON.parse(localStorage.getItem('messages'));
        const finalStorySummary = finalStoryMessages[0].content;
        setContent(finalStorySummary.replace('Summary of the next part of the story:', 'Summary of your story:'));
        setLoadingContent(false);
      }, 500);
      return;
    }

    // Check if we're on an event that already has content, if so use that content instead of generating new content.
    let messages = localStorage.getItem('messages');
    messages = messages ? JSON.parse(messages) : [];
    if (messages.length
      && messages[messages.length -1].role === 'assistant'
      && messages[messages.length -2].role === 'user'
      && event.narrative_event_description === messages[messages.length -2].content) {
      setContent(messages[messages.length -1].content);
      return;
    }

    // Do not make requests to OpenAI endpoints if `no_ai` is set.
    const searchParams = new URLSearchParams(window.location.search)
    const disable_gpt = searchParams.get("no_ai")
    if (disable_gpt) {
      setNoAi(true);
      return;
    }

    setLoadingContent(true);
    setLoadingImage(true);
    // Fetch text content generated by OpenAi
    let text;
    try {
      const data = {
        messages,
        prompt: event.narrative_event_description,
      }

      text = await axios.post(`/api/generate-text`, data);
      renderText(text.data.message)

      // Record the message history in LocalStorage.
      storeMessageHistory('user', data.prompt)
      storeMessageHistory('assistant', text.data.message)

    } catch (error) {
      setErrorMessage(`Error: Unable to fetch text content, see console for details.`)
      throw error;
    }

    // Fetch image content generated by OpenAi
    try {
      const data = {
        prompt: text.data.imagePrompt || 'a yacht on the harbour with police boats nearby',
      }

      const image = await axios.post(`/api/generate-image`, data);

      renderImage(image.data.url)

    } catch (error) {
      setErrorMessage(`Error: Unable to fetch image content, see console for details.`)
      throw error;
    }

  }

  useEffect(() => {
    const fetchData = async () => {
      followLink(null)
    };
    fetchData();
  }, []);

  return (
    <div className="container mx-auto mt-8">
      <button className="underline text-white" onClick={resetUser}>Reset User</button>
      {/* { loadingEvent && <p>Loading...</p> } */}
      { errorMessage && <div className="error">
          <p>{errorMessage}</p>
        </div>
      }
      <div className={`flex flex-col md:flex-row ${loadingEvent ? "loading" : ""}`}>
        <div className='flex-1'>
          <div className='polaroid'>
            <div className={`photo-filter ${!loadingImage && 'loaded'}`}> </div>
            { loadingImage ? <img className='' src="https://placehold.co/512x512" /> : <img src={image} /> }
          </div>
        </div>
        <div className='document flex-1 p-12 xl:p-28'>
          <p className='underline text-center pb-12'><b className="redacted px-8">REDACTED</b> Police Dep</p>
          <h1 className="text-2xl mb-2">{title}</h1>

          { noAi
            ? <p className="mb-2">{description}</p>
            : <div>
              { loadingContent
                ? <div>
                  <p className="inline-redacted"></p>
                  <p className="inline-redacted"></p>
                  <p className="inline-redacted"></p>
                  <p className="inline-redacted"></p>
                  <p className="inline-redacted"></p>
                </div>
                : <p className="mb-2"> {content}</p>
              }
            </div>
          }
          <ul className="flex pl-8 flex-col">
            {
              links.map((link) => (
                <li className={`pb-2 list-disc ${!link.followable && 'hidden'}`} key={link.id}>
                  <button className={`underline text-left hover:decoration-wavy ${loadingContent && 'redacted' }`} onClick={()=> {followLink(link)}} disabled={loadingContent} >
                    {link.label}
                  </button>
                </li>
              ))
            }
          </ul>
        </div>
      </div>

      <div className={`flash ${loadingEvent && 'active'}`}></div>
    </div>
  );
}
