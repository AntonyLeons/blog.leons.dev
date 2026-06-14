/**
 * FitVids utility to make embedded videos responsive.
 */
export function initFitVids(containerSelector = '.post-full-content') {
  const videoSelectors = [
    'iframe[src*="player.vimeo.com"]',
    'iframe[src*="youtube.com"]',
    'iframe[src*="youtube-nocookie.com"]',
    'iframe[src*="kickstarter.com"][src*="video.html"]',
    'object',
    'embed'
  ];
  const postContent = document.querySelector(containerSelector);
  if (postContent) {
    const allVideos = postContent.querySelectorAll(videoSelectors.join(','));
    allVideos.forEach((video) => {
      const vid = video as HTMLElement;
      if (vid.tagName.toLowerCase() === 'embed' && vid.parentNode?.nodeName.toLowerCase() === 'object') return;
      if (vid.closest('.fluid-width-video-wrapper')) return;
      
      const hAttr = vid.getAttribute('height');
      const wAttr = vid.getAttribute('width');
      const height = (vid.tagName.toLowerCase() === 'object' || hAttr) ? parseInt(hAttr || '0', 10) : vid.clientHeight;
      const width = wAttr ? parseInt(wAttr || '0', 10) : vid.clientWidth;
      const aspectRatio = (height && width) ? height / width : 9 / 16;
      
      const wrapper = document.createElement('div');
      wrapper.className = 'fluid-width-video-container';
      const innerWrapper = document.createElement('div');
      innerWrapper.className = 'fluid-width-video-wrapper';
      innerWrapper.style.paddingTop = `${aspectRatio * 100}%`;
      innerWrapper.style.width = '100%';
      innerWrapper.style.position = 'relative';
      
      vid.style.position = 'absolute';
      vid.style.top = '0';
      vid.style.left = '0';
      vid.style.width = '100%';
      vid.style.height = '100%';
      
      if (vid.parentNode) {
        vid.parentNode.insertBefore(wrapper, vid);
        innerWrapper.appendChild(vid);
        wrapper.appendChild(innerWrapper);
      }
      
      vid.removeAttribute('height');
      vid.removeAttribute('width');
    });
  }
}
