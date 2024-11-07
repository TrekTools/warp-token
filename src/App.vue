<template>
  <div id="app" class="lcars">
    <canvas ref="starfield" width="1024" height="768"></canvas>
    <div class="overlay">
      <WalletConnection @nft-selected="handleNftSelected" />
      <button @click="captureAnimation" class="lcars-button" :disabled="isCapturing">
        {{ isCapturing ? 'Capturing...' : 'Engage' }}
      </button>
      <div v-if="videoUrl" class="video-container">
        <video 
          :src="videoUrl" 
          controls 
          loop 
          class="captured-video"
        ></video>
        <div class="button-container">
          <button 
            @click="shareOnTwitter" 
            class="lcars-button twitter-button"
          >
            Post on Twitter 🐦
          </button>
          <button 
            @click="saveAsGif" 
            class="lcars-button gif-button"
            :disabled="isConverting"
          >
            {{ isConverting ? 'Converting...' : 'Save as GIF' }}
          </button>
          <button 
            @click="saveVideo" 
            class="lcars-button video-button"
          >
            Save Video
          </button>
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
      isConverting: false
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
          mimeType: 'video/webm;codecs=h264',
          videoBitsPerSecond: 2500000
        });

        const chunks = [];
        const RECORD_DURATION = 2000; // 2 seconds
        
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
        const blob = new Blob(chunks, { type: 'video/webm' });
        
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
        const tweetText = `My ${nftName} is going to warp speed! 🚀✨`;
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
        window.open(twitterUrl, '_blank');
      } catch (error) {
        console.error('Error sharing:', error);
        alert('Failed to share. Please try again.');
      }
    },
    async saveAsGif() {
      if (!this.videoUrl || this.isConverting) return;
      
      this.isConverting = true;
      
      try {
        // Get NFT name for filename
        const nftName = this.selectedNft?.name?.replace(' #', '').replace(/\s+/g, '') || 'unnamed';
        const filename = `${nftName}-warp-speed.gif`;
        
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
        console.error('Error saving GIF:', error);
        alert('Failed to save GIF. Please try again.');
      } finally {
        this.isConverting = false;
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
  }
}
</script>

<style>
#app {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100vh;
  background-color: #000000;
  margin: 0;
  font-family: 'LCARS', sans-serif;
  color: #FFCC33;
}

canvas {
  z-index: 1;
}

.overlay {
  position: relative;
  z-index: 2;
  margin-top: 20px;
  background-color: #FF6633;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}

.lcars {
  background-color: #000000;
  color: #FFCC33;
  font-family: 'LCARS', sans-serif;
}

.lcars-button {
  background-color: #FF6633;
  border: none;
  color: #000000;
  padding: 10px 20px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  margin: 4px 2px;
  cursor: pointer;
  border-radius: 12px;
}

.lcars-panel {
  background-color: #FFCC33;
  padding: 10px;
  border-radius: 10px;
  margin: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
}

.lcars-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.video-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-top: 20px;
}

.captured-video {
  max-width: 400px;
  border: 2px solid #FF6633;
  border-radius: 10px;
  background-color: black;
}

.twitter-button {
  background-color: #1DA1F2;
  color: white;
  display: flex;
  align-items: center;
  gap: 5px;
}

.twitter-button:hover {
  background-color: #1991DA;
}

.button-container {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.gif-button {
  background-color: #FF6633;  /* LCARS orange */
  color: black;
}

.gif-button:hover:not(:disabled) {
  background-color: #FF8855;
}

.gif-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.video-button {
  background-color: #9999CC;  /* LCARS purple */
  color: white;
}

.video-button:hover {
  background-color: #AAAADD;
}
</style>