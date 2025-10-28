async function getUserSongs() {
    const userCardsContainer = document.querySelector('.userCardsContainer');
    try {
        const response = await fetch('get_user_uploads.php');
        const data = await response.json();

        if (!data.success) {
            userCardsContainer.textContent = "Error fetching your songs.!";
            return;
        }
        let userSongs = data.songs;
        userCardsContainer.innerHTML = "";
        songs.forEach((song, index) => {
            const card = document.createElement('div');
            card.classList.add('fypCard');
            card.dataset.index = index;

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

            // Favorite icon
            const favIcon = document.createElement('div');
            favIcon.classList.add('favIcon');
            const favSvg = document.createElement('img');
            favSvg.src = 'svgs/favIcons/whiteHeart.svg';
            favSvg.alt = 'Favourite';
            favIcon.appendChild(favSvg);
            cardImgDiv.appendChild(favIcon);

            card.appendChild(cardImgDiv);

            // Song title and artist
            const h2 = document.createElement('h2');
            h2.textContent = `${song.title} | ${song.artist}`;
            card.appendChild(h2);

            // Play song when card play button is clicked
            playSvg.addEventListener('click', () => {
                currentSongIndex = index;
                updatePlaybar();
                if (!isPlaying) {
                    togglePlayPause();
                }
            });

            fypContainer.appendChild(card);
        });
    }
    catch(error)
    {
        console.error('Error fetching songs:', error);
    }
 }