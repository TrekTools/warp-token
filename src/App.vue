<template>
  <div id="app" class="lcars">
    <div class="lcars-header">
      <div class="header-left">
        <div class="header-block" @click="refreshPage">
          <img src="@/assets/warp2r.png" alt="Warp Logo" class="header-logo">
        </div>
        <div class="header-title">
          WARPIFY YOUR NFTS
          <div class="contract-address">CA: 0x040111aA11c6A529F33EEf6C6D0114C3F6B49A3E</div>
        </div>
      </div>
      <div class="header-center">
        <div class="social-icons">
          <a href="https://twitter.com/warpsei" target="_blank" class="social-icon">
            <i class="fab fa-twitter"></i>
          </a>
          <a href="https://discord.gg/K9vUgVxm3W" target="_blank" class="social-icon">
            <i class="fab fa-discord"></i>
          </a>
          <a href="https://t.me/warpsei" target="_blank" class="social-icon">
            <i class="fab fa-telegram"></i>
          </a>
        </div>
      </div>
      <div class="header-right">
        <div class="header-numbers">{{ stardate }}</div>
      </div>
      <div class="shooting-star"></div>
      <div class="shooting-star"></div>
      <div class="shooting-star"></div>
    </div>
    
    <div class="main-content">
      <canvas ref="starfield" width="1024" height="768"></canvas>
      <div class="overlay">
        <div class="lcars-panel">
          <WalletConnection @nft-selected="handleNftSelected" />
          <div class="button-grid">
            <button @click="captureAnimation" class="lcars-button primary" :disabled="isCapturing">
              {{ isCapturing ? 'Capturing...' : 'WARPIFY' }}
            </button>
            <div v-if="videoUrl" class="video-container">
              <video :src="videoUrl" controls loop class="captured-video"></video>
              <div class="action-buttons">
                <button @click="shareOnTwitter" class="lcars-button twitter">
                  POST ON TWITTER 🐦
                </button>
                <button @click="saveVideo" class="lcars-button tertiary">
                  SAVE VIDEO
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import WalletConnection from './components/WalletConnection.vue';

export default {
  components: {
    WalletConnection
  },
  data() {
    return {
      selectedNftImage: null,
      nftImageLoaded: false,
      nftImageElement: null,
      animationTime: 0,
      isCapturing: false,
      videoUrl: null,
      showTwitterButton: false,
      stardate: '00000.0',
      stardateInterval: null
    }
  },
  methods: {
    handleNftSelected(nftData) {
      console.log('Received NFT data:', nftData);
      this.selectedNft = nftData;
      const nftImg = new Image();
      nftImg.crossOrigin = "anonymous";
      nftImg.onload = () => {
        console.log('NFT image loaded successfully');
        this.nftImageLoaded = true;
        this.nftImageElement = nftImg;
      };
      nftImg.onerror = () => {
        console.error('Failed to load NFT image');
        this.nftImageLoaded = false;
        this.nftImageElement = null;
      };
      nftImg.src = nftData.image;
      this.selectedNftImage = nftData.image;
    },
    async captureAnimation() {
      if (this.isCapturing) return;
      
      this.isCapturing = true;
      console.log('Starting capture...');
      const canvas = this.$refs.starfield;
      
      try {
        const stream = canvas.captureStream(30);
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'video/mp4',
          videoBitsPerSecond: 2500000
        });

        const chunks = [];
        const RECORD_DURATION = 4000;
        
        mediaRecorder.ondataavailable = (e) => {
          console.log('Chunk received');
          chunks.push(e.data);
        };

        // Create a Promise that resolves when recording is complete
        const recordingPromise = new Promise((resolve, reject) => {
          mediaRecorder.onstop = () => resolve();
          mediaRecorder.onerror = (e) => reject(e);
        });
        
        console.log('Starting recording...');
        mediaRecorder.start();

        setTimeout(() => {
          if (mediaRecorder.state === 'recording') {
            console.log('Stopping recording...');
            mediaRecorder.stop();
          }
        }, RECORD_DURATION);

        await recordingPromise;
        
        console.log('Recording complete, creating video URL...');
        const blob = new Blob(chunks, { type: 'video/mp4' });
        
        // Clear previous video if it exists
        if (this.videoUrl) {
          URL.revokeObjectURL(this.videoUrl);
        }
        
        this.videoUrl = URL.createObjectURL(blob);
        console.log('Video URL created:', this.videoUrl);
        this.showTwitterButton = true;

      } catch (error) {
        console.error('Recording error:', error);
        alert('Failed to capture video. Please try again.');
      } finally {
        this.isCapturing = false;
      }
    },
    async shareOnTwitter() {
      if (!this.videoUrl || !this.selectedNft) return;
      
      try {
        const nftName = this.selectedNft?.name?.replace(' #', '').replace(/\s+/g, '') || 'unnamed';
        const tweetText = `${nftName} is going to $WARP speed! 🚀✨ https://t.me/warpsei CA: 0x921FaF220dcaf3E32FCd474d12C3892040DDe623 @warpsei https://warpify.netlify.app/`;
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
        window.open(twitterUrl, '_blank');
      } catch (error) {
        console.error('Error sharing:', error);
        alert('Failed to share. Please try again.');
      }
    },
    async saveVideo() {
      if (!this.videoUrl) return;
      
      try {
        // Get NFT name for filename
        const nftName = this.selectedNft?.name?.replace(' #', '').replace(/\s+/g, '') || 'unnamed';
        const filename = `${nftName}-warp-speed.mp4`;
        
        // Fetch the video blob
        const response = await fetch(this.videoUrl);
        const blob = await response.blob();
        
        // Create a download URL from the blob
        const url = URL.createObjectURL(blob);
        
        // Create a download link
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        
        // Trigger download
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Clean up the URL
        URL.revokeObjectURL(url);
        
      } catch (error) {
        console.error('Error saving video:', error);
        alert('Failed to save video. Please try again.');
      }
    },
    updateStardate() {
      const now = new Date();
      const year = now.getFullYear();
      const dayOfYear = Math.floor((now - new Date(year, 0, 0)) / 86400000);
      const timeOfDay = (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()) / 86400;
      
      // Format: [Year].[DayOfYear + TimeOfDay]
      const base = (year - 2000) * 1000 + dayOfYear + timeOfDay;
      this.stardate = base.toFixed(1);
    },
    refreshPage() {
      window.location.reload();
    }
  },
  mounted() {
    const canvas = this.$refs.starfield;
    const ctx = canvas.getContext('2d');
    const stars = [];
    const numStars = 2000;
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = require('@/assets/blastoff-removebg.png');
    
    const component = this;
    const floatAmplitude = 15;
    const floatSpeed = 0.02;

    image.onload = () => {
      console.log('Rocket image loaded successfully');
    };

    function drawImage() {
      if (image.complete) {
        const verticalOffset = Math.sin(component.animationTime) * floatAmplitude;
        ctx.drawImage(
          image, 
          canvas.width / 2 - image.width / 2,
          canvas.height / 2 - image.height / 2 + verticalOffset
        );
      }
    }

    function drawNftImage() {
      if (component.nftImageLoaded && component.nftImageElement) {
        const cockpitWidth = 140;
        const cockpitHeight = 140;
        const cockpitX = canvas.width / 2 - cockpitWidth / 2;
        
        // Use the same vertical offset calculation as the ship
        const verticalOffset = Math.sin(component.animationTime) * floatAmplitude;
        const cockpitY = canvas.height / 2 - 200 + verticalOffset; // Apply the same offset
        
        try {
          ctx.save();
          ctx.drawImage(
            component.nftImageElement,
            cockpitX,
            cockpitY,
            cockpitWidth,
            cockpitHeight
          );
          console.log('NFT drawn with offset:', verticalOffset);
          ctx.restore();
        } catch (error) {
          console.error('Error drawing NFT:', error);
        }
      }
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      updateStars();
      drawStars();
      drawImage();
      drawNftImage();
      
      // Update animation time
      component.animationTime += floatSpeed;
      
      requestAnimationFrame(animate);
    }

    function initStars() {
      for (let i = 0; i < numStars; i++) {
        stars.push({
          x: Math.random() * canvas.width - canvas.width / 2,
          y: Math.random() * canvas.height - canvas.height / 2,
          z: Math.random() * canvas.width,
          o: Math.random() * 0.5 + 0.5,
          color: getRandomColor(),
          sizeFactor: Math.random() * 0.59 + 0.41
        });
      }
    }

    function getRandomColor() {
      const colors = ['white', 'blue', 'gold', 'red', 'green', 'pink', 'purple'];
      return colors[Math.floor(Math.random() * colors.length)];
    }

    function updateStars() {
      for (let i = 0; i < numStars; i++) {
        const star = stars[i];
        star.z += 2;
        if (star.z > canvas.width) {
          star.x = Math.random() * canvas.width - canvas.width / 2;
          star.y = Math.random() * canvas.height - canvas.height / 2;
          star.z = 0;
          star.color = getRandomColor();
          star.sizeFactor = Math.random() * 0.59 + 0.41;
        }
      }
    }

    function drawStars() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < numStars; i++) {
        const star = stars[i];
        const k = 128.0 / star.z;
        const x = star.x * k + canvas.width / 2;
        const y = star.y * k + canvas.height / 2;
        const size = (1 - star.z / canvas.width) * 3.2 * star.sizeFactor;
        ctx.fillStyle = star.color;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    initStars();
    animate();
  },
  created() {
    this.updateStardate();
    this.stardateInterval = setInterval(this.updateStardate, 1000);
  },
  beforeUnmount() {
    if (this.stardateInterval) {
      clearInterval(this.stardateInterval);
    }
  }
}
</script>

<style>
body {
  margin: 0;
  padding: 0;
  background-color: black;
  font-family: 'Antonio', sans-serif;
}

#app {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-color: black;
  font-family: 'Antonio', sans-serif;
}

.lcars-header {
  display: flex;
  justify-content: space-between;
  padding: 20px;
  color: #FF9900;
  position: relative;
  overflow: hidden;
  background-color: black;
  height: 100px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-block {
  width: 100px;
  height: 100px;
  background-color: black;
  border-radius: 0 0 50px 0;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  cursor: pointer;
  transition: opacity 0.2s;
}

.header-block:hover {
  opacity: 0.9;
}

.header-logo {
  width: 150%;
  height: 150%;
  object-fit: contain;
}

.header-title {
  font-size: 2.5em;
  font-weight: bold;
  color: #FF9900;
}

.header-numbers {
  font-size: 2em;
  color: #FF9900;
  margin-right: 10px;
}

.main-content {
  position: relative;
  height: calc(100vh - 240px);
}

canvas {
  position: absolute;
  top: 100px;
  left: 0;
  width: 100%;
  height: calc(100% - 100px);
}

.overlay {
  position: relative;
  z-index: 2;
  padding: 20px;
}

.lcars-panel {
  background-color: rgba(0, 0, 0, 0.8);
  border-radius: 15px;
  padding: 20px;
  border: 2px solid #FF9900;
}

.button-grid {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 20px;
}

.lcars-button {
  border: none;
  padding: 12px 24px;
  border-radius: 15px;
  font-weight: bold;
  cursor: pointer;
  font-size: 1.1em;
  transition: opacity 0.2s;
}

.lcars-button.primary {
  background-color: #CC0000;
  color: white;
}

.lcars-button.secondary {
  background-color: #9999CC;
  color: black;
}

.lcars-button.tertiary {
  background-color: #CC99CC;
  color: black;
}

.lcars-button.twitter {
  background-color: #1DA1F2;
  color: white;
}

.lcars-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.video-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.captured-video {
  max-width: 400px;
  border: 2px solid #FF9900;
  border-radius: 10px;
}

.action-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

@keyframes shooting-star {
  0% {
    transform: translateX(100vw) translateY(0) rotate(-45deg);
    opacity: 1;
  }
  100% {
    transform: translateX(-100vw) translateY(0) rotate(-45deg);
    opacity: 0;
  }
}

.shooting-star {
  position: absolute;
  height: 2px;
  background: linear-gradient(90deg, white, transparent);
  border-radius: 50%;
  z-index: 1;
  right: 0;
}

.shooting-star:nth-child(1) {
  width: 100px;
  top: 20px;
  animation: shooting-star 4s linear infinite;
}

.shooting-star:nth-child(2) {
  width: 150px;
  top: 40px;
  animation: shooting-star 6s linear infinite;
  animation-delay: 2s;
}

.shooting-star:nth-child(3) {
  width: 80px;
  top: 60px;
  animation: shooting-star 3s linear infinite;
  animation-delay: 1s;
}

.header-center {
  display: flex;
  align-items: center;
  position: absolute;
  right: 20px;  /* Position under stardate */
  top: 60px;    /* Move below stardate */
}

.social-icons {
  display: flex;
  gap: 20px;
}

.social-icon {
  font-size: 24px;
  text-decoration: none;
  transition: opacity 0.2s, transform 0.2s;
}

.social-icon .fa-twitter {
  color: #1DA1F2;  /* Twitter blue */
}

.social-icon .fa-discord {
  color: #7289DA;  /* Discord purple */
}

.social-icon .fa-telegram {
  color: #0088cc;  /* Telegram blue */
}

.social-icon:hover {
  opacity: 0.8;
  transform: scale(1.1);
}

@media screen and (max-width: 768px) {
  .lcars-header {
    flex-direction: column;
    height: auto;
    padding: 10px;
  }

  .header-left {
    width: 100%;
  }

  .header-title {
    font-size: 1.5em;
    text-align: center;
  }

  .header-center {
    position: static;
    justify-content: center;
    margin-top: 10px;
  }

  .header-right {
    text-align: center;
    margin-top: 10px;
  }

  .social-icons {
    justify-content: center;
    margin-right: 0;
  }

  .main-content {
    padding: 10px;
  }

  .button-grid {
    width: 100%;
  }

  .captured-video {
    max-width: 100%;
  }

  .action-buttons {
    justify-content: center;
  }

  .contract-address {
    font-size: 0.5em;
    text-align: center;
  }
}

/* For very small screens */
@media screen and (max-width: 480px) {
  .header-title {
    font-size: 1.2em;
  }

  .social-icons {
    gap: 15px;
  }

  .social-icon {
    font-size: 20px;
  }
}

.contract-address {
  font-size: 0.4em;
  opacity: 0.8;
  margin-top: 5px;
}
</style>