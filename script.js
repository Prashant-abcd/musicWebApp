// Global variables for carousel
let scrollPosition1 = 0;
let scrollPosition2 = 0;

// Carousel 1: Popular Artists
function moveForward1() {
    const cardContainer = document.getElementById('cardContainer1');
    const allCards = cardContainer.querySelectorAll('.card');
    if (allCards.length === 0) return;

    const scrollAmount = scrollPosition1 === 0 ? allCards[0].offsetWidth + 20 : allCards[0].offsetWidth;

    scrollPosition1 -= scrollAmount;
    const wrapper = cardContainer.parentElement;
    const maxScroll = -(allCards.length * allCards[0].offsetWidth - wrapper.offsetWidth) -100;

    if (scrollPosition1 < maxScroll) {
        scrollPosition1 = 0;
    }

    cardContainer.style.transform = `translateX(${scrollPosition1}px)`;
}

function moveBack1() {
    const cardContainer = document.getElementById('cardContainer1');
    const allCards = cardContainer.querySelectorAll('.card');
    if (allCards.length === 0) return;

    const scrollAmount = scrollPosition1 === -(allCards[0].offsetWidth + 20) ? allCards[0].offsetWidth + 20 : allCards[0].offsetWidth;

    scrollPosition1 += scrollAmount;

    if (scrollPosition1 > 0) {
        scrollPosition1 = 0;
    }

    cardContainer.style.transform = `translateX(${scrollPosition1}px)`;
}

// Carousel 2: Trending
function moveForward2() {
    const cardContainer = document.getElementById('cardContainer2');
    const allCards = cardContainer.querySelectorAll('.card');
    if (allCards.length === 0) return;

    const scrollAmount = scrollPosition2 === 0 ? allCards[0].offsetWidth + 20 : allCards[0].offsetWidth;

    scrollPosition2 -= scrollAmount;
    const wrapper = cardContainer.parentElement;
    const maxScroll = -(allCards.length * scrollAmount - wrapper.offsetWidth) - 100;

    if (scrollPosition2 < maxScroll) {
        scrollPosition2 = 0;
    }

    cardContainer.style.transform = `translateX(${scrollPosition2}px)`;
}

function moveBack2() {
    const cardContainer = document.getElementById('cardContainer2');
    const allCards = cardContainer.querySelectorAll('.card');
    if (allCards.length === 0) return;

    const scrollAmount = scrollPosition2 === -(allCards[0].offsetWidth + 20) ? allCards[0].offsetWidth + 20 : allCards[0].offsetWidth;

    scrollPosition2 += scrollAmount;

    if (scrollPosition2 > 0) {
        scrollPosition2 = 0;
    }

    cardContainer.style.transform = `translateX(${scrollPosition2}px)`;
}

document.addEventListener("DOMContentLoaded", function() {
    // Global variables for the player
    let songs = [];
    let currentSongIndex = 0;
    let audio = new Audio();
    let isPlaying = false;
    let isMuted = false;
    let lastVolume = 100; // Store last volume before muting (default 100%)

    // Elements for the playbar
    const playbar = document.querySelector('.playbar');
    const songInfo = document.querySelector('.songinfo');
    const songTime = document.querySelector('.songtime');
    const playBtn = document.querySelector('.songbuttons img:nth-child(2)');
    const prevBtn = document.querySelector('.songbuttons img:nth-child(1)');
    const nextBtn = document.querySelector('.songbuttons img:nth-child(3)');
    const progressBar = document.querySelector('.progressbar');
    const muteToggle = document.querySelector('.mutetoggle');
    const volumeSlider = document.querySelector('.volumeslider');

    // Function to format time
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    // Function to show the playbar
    function showPlaybar() {
        playbar.classList.add('visible');
    }

    // Function to update the playbar
    function updatePlaybar() {
        if (songs.length > 0) {
            const currentSong = songs[currentSongIndex];
            songInfo.textContent = `${currentSong.title} - ${currentSong.artist}`;
            audio.src = currentSong.file_path;

            // Show playbar if not visible
            showPlaybar();

            // Reset time and progress
            songTime.textContent = '0:00 / 0:00';
            progressBar.value = 0;
            progressBar.style.setProperty('--progress', '0%');

            if (isPlaying) {
                audio.play();
            }

            // Update time and progress bar
            audio.ontimeupdate = () => {
                songTime.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration || 0)}`;
                if (audio.duration) {
                    const progressPercent = (audio.currentTime / audio.duration) * 100;
                    progressBar.value = progressPercent;
                    progressBar.style.setProperty('--progress', `${progressPercent}%`);
                }
            };

            audio.onended = nextSong;
        }
    }

    // Play/Pause toggle
    function togglePlayPause() {
        if (isPlaying) {
            audio.pause();
            playBtn.src = 'svgs/playbar/play-1003-svgrepo-com.svg';
            isPlaying = false;
        } else {
            audio.play();
            playBtn.src = 'svgs/playbar/pause-svgrepo-com.svg';
            isPlaying = true;
        }
    }

    // Next song
    function nextSong() {
        currentSongIndex = (currentSongIndex + 1) % songs.length;
        updatePlaybar();
    }

    // Previous song
    function prevSong() {
        currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
        updatePlaybar();
    }

    // Progress bar seek
    progressBar.addEventListener('input', () => {
        if (audio.duration) {
            audio.currentTime = (progressBar.value / 100) * audio.duration;
            progressBar.style.setProperty('--progress', `${progressBar.value}%`);
        }
    });

    // Volume control
    volumeSlider.addEventListener('input', () => {
        audio.volume = volumeSlider.value / 100;
        lastVolume = volumeSlider.value; // Store last volume
        volumeSlider.style.setProperty('--progress', `${volumeSlider.value}%`);
        isMuted = audio.volume === 0;
        muteToggle.src = isMuted ? 'svgs/playbar/mute-svgrepo-com.svg' : 'svgs/playbar/volume-up-svgrepo-com.svg';
    });

    // Mute toggle
    muteToggle.addEventListener('click', () => {
        if (isMuted) {
            audio.volume = lastVolume / 100; // Restore last volume
            volumeSlider.value = lastVolume; // Update slider position
            volumeSlider.style.setProperty('--progress', `${lastVolume}%`);
            muteToggle.src = 'svgs/playbar/volume-up-svgrepo-com.svg';
            isMuted = false;
        } else {
            lastVolume = audio.volume * 100; // Save current volume
            audio.volume = 0;
            volumeSlider.value = 0; // Move slider to 0
            volumeSlider.style.setProperty('--progress', '0%');
            muteToggle.src = 'svgs/playbar/mute-svgrepo-com.svg';
            isMuted = true;
        }
    });

    // Event listeners for playbar buttons
    playBtn.addEventListener('click', togglePlayPause);
    nextBtn.addEventListener('click', nextSong);
    prevBtn.addEventListener('click', prevSong);

    // Function to fetch songs and generate dynamic cards
    async function getSongs() {
        try {
            const response = await fetch('api.php');
            songs = await response.json();

            const cardContainer = document.getElementById('cardContainer2');
            cardContainer.innerHTML = '';

            songs.forEach((song, index) => {
                const card = document.createElement('div');
                card.classList.add('card');
                card.dataset.index = index;

                const img = document.createElement('img');
                img.src = song.album_art_path;
                img.alt = song.title;
                card.appendChild(img);

                const h2 = document.createElement('h2');
                h2.style.fontSize = '1rem';
                h2.textContent = `${song.title} | ${song.artist}`;
                card.appendChild(h2);

                const cardButton = document.createElement('div');
                cardButton.classList.add('cardButton');

                const svg = document.createElement('img');
                svg.src = 'svgs/cardplaybutton/cardplaybutton.svg';
                svg.style = 'height:30px; width:30px';
                svg.classList.add('cardButtonImg');
                cardButton.appendChild(svg);
                card.appendChild(cardButton);

                svg.addEventListener('click', () => {
                    currentSongIndex = index;
                    updatePlaybar();
                    if (!isPlaying) {
                        togglePlayPause();
                    }
                });

                cardContainer.appendChild(card);
            });
        } catch (error) {
            console.error('Error fetching songs:', error);
        }
    }

    getSongs();



    //get songs of an artist

    const artistCard=document.querySelectorAll('.cardContainer:nth-child(1) .card');
    artistCard.forEach((artistCard)=>{
        artistCard.addEventListener('click',()=>{
            const playlistDiv=document.querySelector('.playlist');
            const artistCardsDiv=document.querySelector('.cardContainerForArtists');
            const artist = artistCard.querySelector('h2').textContent;
            playlistDiv.style.display='none';
            artistCardsDiv.style.display='flex';
             getArtistSongs(artist)
        });
    });
    const gobacktoplaylist=document.querySelector('.goBackToPlaylist');
    gobacktoplaylist.addEventListener('click',()=>{
        const playlistDiv=document.querySelector('.playlist');
            const artistCardsDiv=document.querySelector('.cardContainerForArtists');
            artistCardsDiv.style.display='none';
            playlistDiv.style.display='block';
            getSongs();
    })
   async function getArtistSongs(artist) {
        const artistSongsContainer = document.querySelector('.cardContainerForArtists .container');
        if (!artistSongsContainer) {
            console.error('Error: .artistSongsContainer not found');
            cardContainerForArtists.innerHTML += '<p style="color:red; margin:20px;">Error: No container for songs</p>';
            return;
        }

        try {
            const response = await fetch(`get_artist_songs.php?artist=${encodeURIComponent(artist)}`);
            const data = await response.json();

            if (!data.success) {
                artistSongsContainer.innerHTML = '<p style="color:white; margin:20px;">No songs by this artist.</p>';
                return;
            }
           if(data.songs.length===0)
           {
             artistSongsContainer.innerHTML = '<p style="color:white; margin:20px;">No songs by this artist.</p>';
                return;
           }
            

            songs = data.songs;
            artistSongsContainer.innerHTML = '';

            songs.forEach((song, index) => {
                const card = document.createElement('div');
                card.classList.add('card');
                card.dataset.index = index;

                const img = document.createElement('img');
                img.src = song.album_art_path;
                img.alt = song.title;
                card.appendChild(img);

                const h2 = document.createElement('h2');
                h2.style.fontSize = '1rem';
                h2.textContent = `${song.title} | ${song.artist}`;
                card.appendChild(h2);

                const cardButton = document.createElement('div');
                cardButton.classList.add('cardButton');

                const svg = document.createElement('img');
                svg.src = 'svgs/cardplaybutton/cardplaybutton.svg';
                svg.style = 'height:30px; width:30px';
                svg.classList.add('cardButtonImg');
                cardButton.appendChild(svg);
                card.appendChild(cardButton);

                svg.addEventListener('click', () => {
                    currentSongIndex = index;
                    updatePlaybar();
                    if (!isPlaying) togglePlayPause();
                });

                artistSongsContainer.appendChild(card);
            });
        } catch (error) {
            console.error('Error fetching artist songs:', error);
            artistSongsContainer.innerHTML = '<p style="color:red; margin:20px;">Failed to load artist songs.</p>';
        }
    }

   

    // Signup form handling
    const signupForm = document.querySelector('.signupForm form');
    const signupDiv = document.getElementById('signup');
    const signupBtn = document.querySelector('.signUpBtn');
    const signupSubmitBtn = document.getElementById('signupBtn');
    const signupInput = document.querySelector('.signupInput');
    const crossImg = document.querySelector('.signupCross img');
    const askGenreDiv = document.getElementById('askGenre');
    const finishBtn = document.querySelector('.askgenrefooter button');
    const skipSpan = document.querySelector('.askgenrefooter span');

    signupBtn.addEventListener('click', () => {
        signupDiv.style.display = 'flex';
        signupInput.style.display = 'block';
        askGenreDiv.style.display = 'none';
    });

    crossImg.addEventListener('click', () => {
        signupDiv.style.display = 'none';
        signupInput.style.display = 'block';
        askGenreDiv.style.display = 'none';
    });

    signupSubmitBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // Validate form inputs
        if (signupForm.checkValidity()) {
            signupInput.style.display = 'none';
            askGenreDiv.style.display = 'block';
        } else {
            signupForm.reportValidity();
        }
    });

    const submitForm = async () => {
        const formData = new FormData(signupForm);
        const genreCheckboxes = document.querySelectorAll('.signupgenre input[type="checkbox"]');
        const selectedGenres = Array.from(genreCheckboxes)
            .filter(checkbox => checkbox.checked)
            .map(checkbox => checkbox.value);
        formData.append('genres', JSON.stringify(selectedGenres));

        try {
            const response = await fetch('signup.php', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            if (result.success) {
                alert('Signup successful!');
                 window.location.href = `login.html`;
            } else {
                alert(result.error);
                signupInput.style.display = 'block';
                askGenreDiv.style.display = 'none';
            }
        } catch (error) {
            console.error('Error during signup:', error);
            alert('An error occurred during signup. Please try again.');
            signupInput.style.display = 'block';
            askGenreDiv.style.display = 'none';
        }
    };

    finishBtn.addEventListener('click', submitForm);
    skipSpan.addEventListener('click', submitForm);

    




    //login


    // Select login elements
const loginDiv = document.querySelector('.login');
const loginCross = document.querySelector('.loginCross img');
const loginForm = document.forms['loginForm'];

// Show login form (e.g., on a button click)
const loginBtn = document.querySelector('.loginBtn'); 
if (loginBtn) {
    loginBtn.onclick = () => {
        loginDiv.style.display = 'flex';
    };
}

// Hide login form
if (loginCross) {
    loginCross.onclick = () => {
        loginDiv.style.display = 'none';
    };
}

// Handle login form submission
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData(loginForm);
            const response = await fetch('login.php', { method: 'POST', body: formData });
            const data = await response.json();
            if (data.success) {
                alert(data.message || 'Login successful!');
                loginForm.reset();
                loginDiv.style.display = 'none';
                window.location.href = 'login.html'; // Redirect to your main page
            } else {
                alert(data.error || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Error logging in');
        }
    });
}
});