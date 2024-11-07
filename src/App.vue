<template>
  <div id="app" class="lcars">
    <canvas ref="starfield" width="1024" height="768"></canvas>
    <div class="overlay">
      <WalletConnection @nft-selected="handleNftSelected" />
      <button @click="captureAnimation" class="lcars-button" :disabled="isCapturing">
        {{ isCapturing ? 'Capturing...' : 'Export to GIF' }}
      </button>
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
      isCapturing: false
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
      console.log('Selected NFT when capturing:', this.selectedNft);
      const canvas = this.$refs.starfield;
      
      try {
        const stream = canvas.captureStream(30);
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'video/webm',
          videoBitsPerSecond: 2500000
        });

        const chunks = [];
        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        
        mediaRecorder.onstop = async () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          
          try {
            const formData = new FormData();
            formData.append('file', blob, 'capture.webm');
            formData.append('upload_preset', process.env.VUE_APP_CLOUDINARY_UPLOAD_PRESET);
            formData.append('resource_type', 'video');

            console.log('Uploading to Cloudinary...');
            console.log('Cloud name:', process.env.VUE_APP_CLOUDINARY_CLOUD_NAME);
            console.log('Upload preset:', process.env.VUE_APP_CLOUDINARY_UPLOAD_PRESET);

            const response = await fetch(
              `https://api.cloudinary.com/v1_1/${process.env.VUE_APP_CLOUDINARY_CLOUD_NAME}/video/upload`,
              {
                method: 'POST',
                body: formData
              }
            );

            const data = await response.json();
            console.log('Full Cloudinary response:', data);

            if (!response.ok) {
              throw new Error(`Upload failed: ${data.error?.message || 'Unknown error'}`);
            }
            
            if (data.secure_url) {
              // Get NFT name for the tweet text
              const nftName = this.selectedNft?.name?.replace(' #', '').replace(/\s+/g, '') || 'unnamed';
              
              // Prepare tweet text with video link
              const tweetText = `My ${nftName} is going to warp speed! 🚀✨\n${data.secure_url}`;
              
              // Open Twitter Web Intent
              const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
              window.open(twitterUrl, '_blank');
            } else {
              throw new Error('No secure URL in response');
            }
          } catch (error) {
            console.error('Detailed upload error:', error);
            console.error('Error message:', error.message);
            alert(`Upload failed: ${error.message}`);
          }
          
          this.isCapturing = false;
        };

        // Start recording
        mediaRecorder.start();

        // Record for 2 seconds
        setTimeout(() => {
          mediaRecorder.stop();
        }, 2000);

      } catch (error) {
        console.error('Error capturing animation:', error);
        this.isCapturing = false;
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
</style>
