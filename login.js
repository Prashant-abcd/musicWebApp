document.addEventListener("DOMContentLoaded", function () {
    // Player variables
    let songs = [];
    let allFypSongs = [];
    let currentSongIndex = 0;
    let audio = new Audio();
    let isPlaying = false;
    let isMuted = false;
    let lastVolume = 100;
    let currentSongToDelete = null;
    let selectedGenre = ''; // Track selected genre

    // DOM elements
    const playbar = document.querySelector('.playbar');
    const songInfo = document.querySelector('.songinfo');
    const songTime = document.querySelector('.songtime');
    const playBtn = document.querySelector('.songbuttons img:nth-child(2)');
    const prevBtn = document.querySelector('.songbuttons img:nth-child(1)');
    const nextBtn = document.querySelector('.songbuttons img:nth-child(3)');
    const progressBar = document.querySelector('.progressbar');
    const muteToggle = document.querySelector('.mutetoggle');
    const volumeSlider = document.querySelector('.volumeslider');
    const searchInput = document.querySelector('#searchInput');
    const userUploadsDiv = document.querySelector('.userUploads');
    const myUploads = document.querySelector('.myuploads');
    const favourite = document.querySelector('.favourite');
    const genreSelect = document.querySelector('#genre');
    const genreSongsDiv = document.querySelector('.genreSongs');
    const gobacktofyp = document.querySelectorAll('.gobacktofyp');
    const uploadimg = document.querySelector('.uploadimg');
    const songInfoDiv = document.querySelector('.signup');
    const crossImg = document.querySelector('.signupCross img');
    const logout = document.querySelector('.logout');
    const logoutConfirmation = document.querySelector('.logoutConfirmation');
    const deleteConfirmationDiv = document.querySelector('.deleteConfirmation');
    const yesDelete = document.querySelector('.deleteConfirmation .buttonContainer button:nth-child(1)');
    const noDelete = document.querySelector('.deleteConfirmation .buttonContainer button:nth-child(2)');

    // Format time
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    // Update playbar
    function updatePlaybar() {
        if (songs.length > 0) {
            const currentSong = songs[currentSongIndex];
            songInfo.textContent = `${currentSong.title} | ${currentSong.artist}`;
            audio.src = currentSong.song_path;
            playbar.classList.add('visible');
            songTime.textContent = '0:00 / 0:00';
            progressBar.value = 0;
            progressBar.style.setProperty('--progress', '0%');

            if (isPlaying) audio.play();

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

    // Event listeners for player controls
    playBtn.addEventListener('click', togglePlayPause);
    nextBtn.addEventListener('click', nextSong);
    prevBtn.addEventListener('click', prevSong);
    progressBar.addEventListener('input', () => {
        if (audio.duration) {
            audio.currentTime = (progressBar.value / 100) * audio.duration;
            progressBar.style.setProperty('--progress', `${progressBar.value}%`);
        }
    });

    volumeSlider.addEventListener('input', () => {
        audio.volume = volumeSlider.value / 100;
        lastVolume = volumeSlider.value;
        volumeSlider.style.setProperty('--progress', `${volumeSlider.value}%`);
        isMuted = audio.volume === 0;
        muteToggle.src = isMuted ? 'svgs/playbar/mute-svgrepo-com.svg' : 'svgs/playbar/volume-up-svgrepo-com.svg';
    });

    muteToggle.addEventListener('click', () => {
        if (isMuted) {
            audio.volume = lastVolume / 100;
            volumeSlider.value = lastVolume;
            volumeSlider.style.setProperty('--progress', `${lastVolume}%`);
            muteToggle.src = 'svgs/playbar/volume-up-svgrepo-com.svg';
            isMuted = false;
        } else {
            lastVolume = audio.volume * 100;
            audio.volume = 0;
            volumeSlider.value = 0;
            volumeSlider.style.setProperty('--progress', '0%');
            muteToggle.src = 'svgs/playbar/mute-svgrepo-com.svg';
            isMuted = true;
        }
    });

    // Delete confirmation listeners
    if (yesDelete) {
        yesDelete.addEventListener('click', async () => {
            if (!currentSongToDelete) {
                alert('No song selected for deletion');
                return;
            }

            try {
                console.log('Yes button clicked, deleting:', currentSongToDelete);
                const response = await fetch('delete_user_song.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ songTitle: currentSongToDelete })
                });
                console.log('Delete response status:', response.status);
                if (!response.ok) {
                    const text = await response.text();
                    console.error('Non-JSON response:', text);
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                const data = await response.json();
                console.log('Delete response data:', data);
                if (data.success) {
                    alert(data.message);
                    deleteConfirmationDiv.classList.remove('visible');
                    currentSongToDelete = null;
                    await getUserSongs();
                    await getSongs();
                    if (selectedGenre) await getGenreSongs(selectedGenre);
                } else {
                    alert(data.error || 'Failed to delete song');
                }
            } catch (error) {
                console.error('Delete error:', error);
                alert('Error deleting song');
            }
        });
    }

    if (noDelete) {
        noDelete.addEventListener('click', () => {
            console.log('No button clicked');
            deleteConfirmationDiv.classList.remove('visible');
            currentSongToDelete = null;
        });
    }

    // Get username
    async function getUsername() {
        const userName = document.querySelector('.userProfile h2');
        try {
            const response = await fetch('user.php');
            const data = await response.json();
            userName.textContent = data.success ? data.username : 'Guest';
        } catch (err) {
            console.error('Fetch error:', err);
            userName.textContent = 'Error';
        }
    }
    getUsername();

    // Render songs to .fyp
    async function renderSongs(songList, container = '.fyp') {
        const targetContainer = document.querySelector(container);
        if (!targetContainer) {
            console.error(`Error: ${container} container not found`);
            return;
        }
        targetContainer.innerHTML = '';

        if (songList.length === 0) {
            targetContainer.innerHTML = '<p style="color:white; margin:20px;">No songs found.</p>';
            return;
        }

        for (const [index, song] of songList.entries()) {
            const card = document.createElement('div');
            card.classList.add('fypCard');
            card.dataset.index = index;
            card.dataset.songTitle = song.title;

            const cardImgDiv = document.createElement('div');
            cardImgDiv.classList.add('fypcardimg');

            const img = document.createElement('img');
            img.src = song.thumbnail_path;
            img.alt = song.title;
            cardImgDiv.appendChild(img);

            const cardBtn = document.createElement('div');
            cardBtn.classList.add('cardBtn');
            const playSvg = document.createElement('img');
            playSvg.src = 'svgs/cardplaybutton/cardplaybutton.svg';
            playSvg.alt = 'Play';
            cardBtn.appendChild(playSvg);
            cardImgDiv.appendChild(cardBtn);

            const favIcon = document.createElement('div');
            favIcon.classList.add('favIcon');
            const favSvg = document.createElement('img');
            try {
                const response = await fetch('check_favourite.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ songTitle: song.title })
                });
                const data = await response.json();
                favSvg.src = data.isFavorited ? 'svgs/favIcons/pinkHeart.svg' : 'svgs/favIcons/whiteHeart.svg';
            } catch (error) {
                console.error('Error checking favorite status:', error);
                favSvg.src = 'svgs/favIcons/whiteHeart.svg';
            }
            favSvg.alt = 'Favourite';
            favIcon.appendChild(favSvg);
            cardImgDiv.appendChild(favIcon);

            if (container === '.userCardsContainer') {
                const deleteImgDiv = document.createElement('div');
                deleteImgDiv.classList.add('deleteimg');
                const deleteImg = document.createElement('img');
                deleteImg.src = 'svgs/delete/delete-1487-svgrepo-com.svg';
                deleteImg.alt = 'Delete';
                deleteImgDiv.appendChild(deleteImg);
                cardImgDiv.appendChild(deleteImgDiv);

                deleteImg.addEventListener('click', () => {
                    currentSongToDelete = song.title;
                    console.log('Selected song to delete:', currentSongToDelete);
                    if (deleteConfirmationDiv) {
                        deleteConfirmationDiv.classList.add('visible');
                    } else {
                        console.error('deleteConfirmation div not found');
                    }
                });
            }

            card.appendChild(cardImgDiv);

            const h2 = document.createElement('h2');
            h2.textContent = `${song.title} | ${song.artist}`;
            card.appendChild(h2);

            playSvg.addEventListener('click', () => {
                songs = songList;
                currentSongIndex = index;
                updatePlaybar();
                if (!isPlaying) togglePlayPause();
            });

            favSvg.addEventListener('click', async () => {
                try {
                    const response = await fetch('toggle_favourite.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ songTitle: song.title })
                    });
                    const data = await response.json();
                    if (data.success) {
                        favSvg.src = data.isFavorited ? 'svgs/favIcons/pinkHeart.svg' : 'svgs/favIcons/whiteHeart.svg';
                        await getFavouriteSongs();
                        await getSongs();
                        if (selectedGenre && container === '.genreSongsCardsContainer') {
                            await getGenreSongs(selectedGenre);
                        }
                    } else {
                        alert(data.error || 'Failed to toggle favorite');
                    }
                } catch (error) {
                    console.error('Toggle favorite error:', error);
                    alert('Error toggling favorite');
                }
            });

            targetContainer.appendChild(card);
        }
    }

    // Fetch FYP songs
    async function getSongs() {
        try {
            const response = await fetch('fyp_songs.php');
            const data = await response.json();
            if (!data.success) {
                console.error('Error fetching songs:', data.error);
                const fypContainer = document.querySelector('.fyp');
                fypContainer.innerHTML = '<p style="color:white; margin:20px;">No songs available.</p>';
                return;
            }
            allFypSongs = data.songs;
            songs = allFypSongs;
            await renderSongs(songs, '.fyp');
        } catch (error) {
            console.error('Error fetching songs:', error);
            const fypContainer = document.querySelector('.fyp');
            fypContainer.innerHTML = '<p style="color:red; margin:20px;">Failed to load songs.</p>';
        }
    }
    getSongs();

    // Fetch and render genre songs
    async function getGenreSongs(genre) {
        const genreSongsCardsContainer = document.querySelector('.genreSongsCardsContainer');
        if (!genreSongsCardsContainer) {
            console.error('Error: .genreSongsCardsContainer not found');
            genreSongsDiv.innerHTML += '<p style="color:red; margin:20px;">Error: No container for songs</p>';
            return;
        }

        try {
            const response = await fetch(`fyp_songs.php?genre=${encodeURIComponent(genre)}`);
            const data = await response.json();

            if (!data.success) {
                genreSongsCardsContainer.innerHTML = '<p style="color:white; margin:20px;">No songs in this genre.</p>';
                return;
            }

            songs = data.songs;
            await renderSongs(songs, '.genreSongsCardsContainer');
        } catch (error) {
            console.error('Error fetching genre songs:', error);
            genreSongsCardsContainer.innerHTML = '<p style="color:red; margin:20px;">Failed to load genre songs.</p>';
        }
    }

    // Genre selection
    if (genreSelect) {
        genreSelect.addEventListener('change', async (e) => {
            selectedGenre = e.target.value;
            console.log('Selected genre:', selectedGenre);
            if (selectedGenre) {
                const fyp = document.querySelector('.fyp');
                const favouriteDiv = document.querySelector('.favourites');
                const userUploads = document.querySelector('.userUploads');
                fyp.style.display = 'none';
                favouriteDiv.style.display = 'none';
                userUploads.style.display = 'none';
                genreSongsDiv.style.display = 'flex';
                searchInput.value = ''; // Clear search
                await getGenreSongs(selectedGenre);
            } else {
                // If no genre selected, return to FYP
                genreSongsDiv.style.display = 'none';
                document.querySelector('.fyp').style.display = 'flex';
                await getSongs();
            }
        });
    }

    // Search functionality with debounce
    function debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    if (searchInput) {
        searchInput.addEventListener('input', debounce((e) => {
            const query = e.target.value.trim().toLowerCase();
            if (genreSongsDiv.style.display === 'flex') {
                // Filter genre songs
                const filteredSongs = songs.filter(song =>
                    song.title.toLowerCase().includes(query)
                );
                renderSongs(filteredSongs, '.genreSongsCardsContainer');
            } else if (document.querySelector('.fyp').style.display === 'flex') {
                // Filter FYP songs
                const filteredSongs = allFypSongs.filter(song =>
                    song.title.toLowerCase().includes(query)
                );
                renderSongs(filteredSongs, '.fyp');
            }
            // Note: Search doesn't affect .favourites or .userUploads
        }, 300));
    }

    // User uploads navigation
    myUploads.addEventListener('click', async () => {
        const fyp = document.querySelector('.fyp');
        const favouriteDiv = document.querySelector('.favourites');
        const genreSongs = document.querySelector('.genreSongs');
        fyp.style.display = 'none';
        favouriteDiv.style.display = 'none';
        genreSongs.style.display = 'none';
        userUploadsDiv.style.display = 'flex';
        searchInput.value = '';
        await getUserSongs();
    });

    // Favourites navigation
    favourite.addEventListener('click', async () => {
        const fyp = document.querySelector('.fyp');
        const userUploads = document.querySelector('.userUploads');
        const genreSongs = document.querySelector('.genreSongs');
        const favouriteDiv = document.querySelector('.favourites');
        userUploads.style.display = 'none';
        fyp.style.display = 'none';
        genreSongs.style.display = 'none';
        favouriteDiv.style.display = 'flex';
        searchInput.value = '';
        await getFavouriteSongs();
    });

    // Go back to FYP
    console.log('Found gobacktofyp elements:', gobacktofyp.length);
    gobacktofyp.forEach(button => {
        button.addEventListener('click', async () => {
            console.log('Go back to FYP clicked');
            const userUploadsDiv = document.querySelector('.userUploads');
            const favouriteDiv = document.querySelector('.favourites');
            const genreSongs = document.querySelector('.genreSongs');
            const fyp = document.querySelector('.fyp');
            userUploadsDiv.style.display = 'none';
            favouriteDiv.style.display = 'none';
            genreSongs.style.display = 'none';
            fyp.style.display = 'flex';
            searchInput.value = '';
            genreSelect.value = ''; // Reset genre dropdown
            selectedGenre = '';
            await getSongs();
        });
    });

    uploadimg.onclick = () => {
        songInfoDiv.style.display = 'flex';
    };

    crossImg.onclick = () => {
        songInfoDiv.style.display = 'none';
    };

    // Fetch and render user songs
    async function getUserSongs() {
        const userCardsContainer = document.querySelector('.userCardsContainer');
        if (!userCardsContainer) {
            console.error('Error: .userCardsContainer not found');
            userUploadsDiv.innerHTML += '<p style="color:red; margin:20px;">Error: No container for songs</p>';
            return;
        }

        try {
            const response = await fetch('get_user_uploads.php');
            const data = await response.json();
            console.log('get_user_uploads.php response:', data);

            if (!data.success) {
                userCardsContainer.innerHTML = '<p style="color:white; margin:20px;">No uploads yet.</p>';
                return;
            }

            songs = data.songs;
            await renderSongs(songs, '.userCardsContainer');
        } catch (error) {
            console.error('Error fetching songs:', error);
            userCardsContainer.innerHTML = '<p style="color:red; margin:20px;">Failed to load uploads.</p>';
        }
    }

    // Song upload form
    const userUploadForm = document.forms['userUploadForm'];
    userUploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const songUploadFormData = new FormData(userUploadForm);
            const response = await fetch('uploadUserSong.php', { method: 'POST', body: songUploadFormData });
            const data = await response.json();
            if (data.success) {
                alert(data.message);
                userUploadForm.reset();
                songInfoDiv.style.display = 'none';
                await getUserSongs();
                await getSongs();
                if (selectedGenre) await getGenreSongs(selectedGenre);
            } else {
                alert(data.error || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Error uploading songs');
        }
    });

    // Fetch and render favourite songs
    async function getFavouriteSongs() {
        const favouritesCardsContainer = document.querySelector('.favouritesCardsContainer');
        if (!favouritesCardsContainer) {
            console.error('Error: .favouritesCardsContainer not found');
            userUploadsDiv.innerHTML += '<p style="color:red; margin:20px;">Error: No container for songs</p>';
            return;
        }

        try {
            const response = await fetch('get_favourite_songs.php');
            const data = await response.json();

            if (!data.success) {
                favouritesCardsContainer.innerHTML = '<p style="color:white; margin:20px;">No favourites yet.</p>';
                return;
            }

            songs = data.songs;
            await renderSongs(songs, '.favouritesCardsContainer');
        } catch (error) {
            console.error('Error fetching favorite songs:', error);
            favouritesCardsContainer.innerHTML = '<p style="color:red; margin:20px;">Failed to load favourites.</p>';
        }
    }

    // Logout
    logout.addEventListener('click', () => {
        logoutConfirmation.classList.add('visible');
    });

    const yesbtn = document.querySelector('.logoutConfirmation .box button:nth-child(1)');
    const nobtn = document.querySelector('.logoutConfirmation .box button:nth-child(2)');

    yesbtn.onclick = async () => {
        try {
            const response = await fetch('logout.php');
            const data = await response.json();
            if (data.success) {
                alert(data.message);
                logoutConfirmation.classList.remove('visible');
                window.location.href = 'index.html';
            } else {
                alert('Logout failed.');
            }
        } catch (err) {
            console.error('Error:', err);
            alert('Network error');
        }
    };

    nobtn.onclick = () => {
        logoutConfirmation.classList.remove('visible');
    };
});