import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [currentTimelineEventId, setCurrentTimelineEventId] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [context, setContext] = useState('');
  const [links, setLinks] = useState([]);

  const resetUser = () => {
    // Remove current user.
    localStorage.removeItem('userId');
    localStorage.removeItem('context');
    // Refresh the page
    location.reload();
  };

  const renderEvent = (currentEvent) => {
    setCurrentTimelineEventId(currentEvent.id);
    setTitle(currentEvent.narrative_event_title);
    setDescription(currentEvent.narrative_event_description);
    setLinks(currentEvent.links);
    setContent(currentEvent.narrative_event_content);

    let context = localStorage.getItem('context');
    let newContext = `${context}

    ${currentEvent.narrative_event_content}
    `
    setContext(newContext);
    localStorage.setItem('context', newContext);
    setLoading(false);
  };

  const followLink = async (link) => {
    setLoading(true);
    let userId = localStorage.getItem('userId');
    let context = localStorage.getItem('context');
    // Progress the story
    const data = {
      user: userId,
      linkToFollow: link.id,
      isNewUser: false,
      currentTimelineEvent: currentTimelineEventId,
      context: context
    }

    const searchParams = new URLSearchParams(window.location.search)
    const disable_gpt = searchParams.get("no_ai")
    if (disable_gpt) {
      data.disable_gpt = true;
    }
    const response = await axios.post(`/api/follow-link`, data);
    renderEvent(response.data.data)
  }


  useEffect(() => {
    const fetchData = async () => {

      // Make or set a user
      let userId = localStorage.getItem('userId');
      let context = localStorage.getItem('context');
      let isNewUser = false;

      if (!userId || !context) {
        // Generate a new user ID.
        userId = "id" + Math.random().toString(16).slice(2)
        // Set the ID in local storage.
        localStorage.setItem('userId', userId);
        localStorage.setItem('context', '');
        isNewUser = true;
      }

      // Progress the story
      const data = {
        user: userId,
        linkToFollow: null,
        isNewUser,
        context,
      }
      const response = await axios.post(`/api/follow-link`, data);
      renderEvent(response.data.data)
    };
    fetchData();
  }, []);

  return (
    <div class="container mx-auto mt-8">
      <button class="float-right my-2 px-4 py-2 font-semibold text-sm bg-cyan-500 text-white rounded-full shadow-sm" onClick={resetUser}>Reset User</button>
      { loading && <p>Loading...</p> }
      { !loading &&
        <div>
          <h1 class="text-2xl mb-2">{title}</h1>
          <p class="mb-2">{description}</p>
          <p class="mb-2">{content}</p>
          <ul class="flex">
            {
              links.map((link) => (
                <button class="mr-2 px-4 py-2 font-semibold text-sm bg-sky-500 text-white rounded-none shadow-sm enabled:hover:bg-sky-600 disabled:bg-gray-500" key={link.id} onClick={()=> {followLink(link)}} disabled={!link.followable} >
                  {link.label}
                </button>
              ))
            }
          </ul>
        </div>
      }
    </div>
  );
}
