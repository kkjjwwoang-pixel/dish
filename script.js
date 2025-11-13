// 버튼 텍스트 설정
const BUTTON_TEXTS = {
    next: '고마워',
    nextJapan: '고마워',
    nextChina: '고마워'
};

// 화면 전환 관리
const screens = {
    title: document.getElementById('title-screen'),
    map: document.getElementById('map-screen'),
    japan: document.getElementById('japan-stage'),
    china: document.getElementById('china-stage')
};

let currentScreen = 'title';
let japanCompleted = false;
let chinaCompleted = false;

// 정답 위치 매핑
const correctPositions = {
    'rice-bowl': 'drop-rice-bowl',
    'spoon': 'drop-spoon',
    'chopsticks': 'drop-chopsticks'
};

// 중국 스테이지 정답 위치 매핑
const correctPositionsChina = {
    'rice-bowl': 'drop-rice-bowl-china',
    'spoon': 'drop-spoon-china',
    'chopsticks': 'drop-chopsticks-china'
};

// 배치된 아이템 추적
const placedItems = {};

// 화면 전환 함수
function showScreen(screenName) {
    Object.values(screens).forEach(screen => {
        screen.classList.remove('active');
    });
    
    if (screens[screenName]) {
        screens[screenName].classList.add('active');
        currentScreen = screenName;
    }
}

// 시작하기 버튼
document.getElementById('start-btn').addEventListener('click', () => {
    showScreen('map');
});

// 일본 클릭
document.querySelector('.country.korea').addEventListener('click', () => {
    // 다른 스테이지 완전히 초기화
    resetStage('china');
    // 일본 스테이지도 초기화
    resetStage('japan');
    showScreen('japan');
    initializeJapanStage();
});

// 중국 클릭
document.querySelector('.country.china').addEventListener('click', () => {
    // 다른 스테이지 완전히 초기화
    resetStage('japan');
    // 중국 스테이지도 초기화
    resetStage('china');
    showScreen('china');
    initializeChinaStage();
});

// 스테이지 완전 초기화 함수
function resetStage(stageName) {
    if (stageName === 'japan') {
        // 일본 스테이지 완전 초기화
        const japanStage = document.getElementById('japan-stage');
        if (japanStage) {
            // 모든 드롭 존 초기화
            japanStage.querySelectorAll('.drop-zone').forEach(zone => {
                zone.classList.remove('correct', 'filled', 'drag-over');
                const existingItem = zone.querySelector('.dropped-item');
                if (existingItem) {
                    existingItem.remove();
                }
            });
            
            // 셰프테이블 밥그릇 제거
            const cheftableRiceBowl = japanStage.querySelector('.cheftable-rice-bowl');
            if (cheftableRiceBowl) {
                cheftableRiceBowl.remove();
            }
            
            // grab 이미지 제거
            const grabImage = document.getElementById('grab-image');
            if (grabImage) {
                grabImage.remove();
            }
            
            // 손 이미지 다시 표시 및 하이라이팅 제거
            const handElement = document.getElementById('hand-draggable');
            if (handElement) {
                handElement.style.display = 'block';
                handElement.classList.remove('highlight-pulse');
            }
            
            // 말풍선 숨기기
            const speechBubble = document.getElementById('speech-bubble');
            if (speechBubble) {
                speechBubble.classList.remove('show');
            }
            
            // 정보 메뉴 닫기
            const infoMenus = japanStage.querySelectorAll('.info-menu');
            infoMenus.forEach(menu => {
                menu.style.display = 'none';
            });
            
            // 슬롯 아이템 초기화 및 하이라이팅 제거
            japanStage.querySelectorAll('.slot-item').forEach(item => {
                item.style.display = 'block';
                item.style.opacity = '1';
                item.style.pointerEvents = 'auto';
                item.classList.remove('highlight-pulse');
            });
            
            // 드랍존 하이라이팅 제거
            japanStage.querySelectorAll('.drop-zone').forEach(zone => {
                zone.classList.remove('highlight-pulse');
            });
            
            // 타이핑 인터벌 정리
            if (currentTypingInterval) {
                clearInterval(currentTypingInterval);
                currentTypingInterval = null;
            }
            
            // 콜백 초기화
            onNextCallback = null;
            currentSpeechIndex = 0;
            
            // 완료 상태 초기화
            japanCompleted = false;
            allUtensilsPlaced = false;
            
            // 배치된 아이템 초기화
            Object.keys(placedItems).forEach(key => delete placedItems[key]);
            
            // 손가락 가이드 제거
            const fingerGuide = document.getElementById('finger-guide');
            if (fingerGuide) {
                fingerGuide.remove();
            }
            
            // 밥그릇 드랍존 숨기기
            const riceBowlDropZone = document.getElementById('rice-bowl-drop-zone');
            if (riceBowlDropZone) {
                riceBowlDropZone.style.display = 'none';
            }
        }
    } else if (stageName === 'china') {
        // 중국 스테이지 완전 초기화
        const chinaStage = document.getElementById('china-stage');
        if (chinaStage) {
            // 모든 드롭 존 초기화
            chinaStage.querySelectorAll('.drop-zone').forEach(zone => {
                zone.classList.remove('correct', 'filled', 'drag-over');
                const existingItem = zone.querySelector('.dropped-item');
                if (existingItem) {
                    existingItem.remove();
                }
            });
            
            // grab 이미지 제거
            const grabImage = document.getElementById('grab-image-china');
            if (grabImage) {
                grabImage.remove();
            }
            
            // 손 이미지 다시 표시
            const handElement = document.getElementById('hand-draggable-china');
            if (handElement) {
                handElement.style.display = 'block';
            }
            
            // 말풍선 숨기기
            const speechBubble = document.getElementById('speech-bubble-china');
            if (speechBubble) {
                speechBubble.classList.remove('show');
            }
            
            // 정보 메뉴 닫기
            const infoMenus = chinaStage.querySelectorAll('.info-menu');
            infoMenus.forEach(menu => {
                menu.style.display = 'none';
            });
            
            // 밥그릇 드랍존 숨기기
            const riceBowlDropZone = document.getElementById('rice-bowl-drop-zone-china');
            if (riceBowlDropZone) {
                riceBowlDropZone.style.display = 'none';
            }
            
            // 타이핑 인터벌 정리
            if (currentTypingInterval) {
                clearInterval(currentTypingInterval);
                currentTypingInterval = null;
            }
            
            // 콜백 초기화
            onNextCallback = null;
            currentSpeechIndexChina = 0;
            enableTableRotationCheck = false;
            
            // 완료 상태 초기화
            chinaCompleted = false;
            allUtensilsPlaced = false;
            
            // 배치된 아이템 초기화
            Object.keys(placedItems).forEach(key => delete placedItems[key]);
        }
    }
}

// 지도 돌아가기 버튼
document.getElementById('back-to-map-japan').addEventListener('click', () => {
    showScreen('map');
});

document.getElementById('back-to-map-china').addEventListener('click', () => {
    showScreen('map');
});

// 일본 스테이지 초기화
function initializeJapanStage() {
    // 완료 상태 초기화 (다시 플레이 가능하도록)
    japanCompleted = false;
    allUtensilsPlaced = false;
    
    // 모든 드롭 존 초기화 (일본 스테이지만)
    const japanStage = document.getElementById('japan-stage');
    if (japanStage) {
        japanStage.querySelectorAll('.drop-zone').forEach(zone => {
        zone.classList.remove('correct', 'filled', 'drag-over');
        const existingItem = zone.querySelector('.dropped-item');
        if (existingItem) {
            existingItem.remove();
        }
        });
    }
    
    // 배치된 아이템 초기화
    Object.keys(placedItems).forEach(key => delete placedItems[key]);
    
    // 셰프테이블 밥그릇 제거 (일본 스테이지만)
    const cheftableRiceBowl = japanStage ? japanStage.querySelector('.cheftable-rice-bowl') : null;
    if (cheftableRiceBowl) {
        cheftableRiceBowl.remove();
    }
    
    // grab 이미지 제거
    const grabImage = document.getElementById('grab-image');
    if (grabImage) {
        grabImage.remove();
    }
    
    // 손 이미지 다시 표시 및 하이라이팅 제거
    const handElement = document.getElementById('hand-draggable');
    if (handElement) {
        handElement.style.display = 'block';
        handElement.classList.remove('highlight-pulse');
    }
    
    // 정보 메뉴 닫기
    closeChopsticksInfoMenu();
    closeUtensilHoldingInfoMenu();
    
    // 밥그릇 드롭존 숨기기
    const riceBowlDropZone = document.getElementById('rice-bowl-drop-zone');
    if (riceBowlDropZone) {
        riceBowlDropZone.style.display = 'none';
    }
    
    // 슬롯 아이템 다시 활성화 및 하이라이팅 제거 (일본 스테이지만)
    if (japanStage) {
        japanStage.querySelectorAll('.slot-item').forEach(item => {
        item.style.display = 'block';
        item.style.opacity = '1';
        item.style.pointerEvents = 'auto';
        item.classList.remove('highlight-pulse'); // 강조 애니메이션 제거
        });
        
        // 드랍존 하이라이팅 제거
        japanStage.querySelectorAll('.drop-zone').forEach(zone => {
            zone.classList.remove('highlight-pulse');
        });
    }
    
    // 드롭 존 크기를 실제 이미지 사이즈에 맞게 조정
    adjustDropZonesToImageSize();
    
    // 손 이미지 드래그 기능 초기화
    initializeHandDragging();
    
    // 밥그릇 드롭존 이벤트 설정
    setupRiceBowlDropZone();
    
    // 말풍선 초기화 및 시작 메시지 표시
    currentSpeechIndex = 0;
    showNextSpeech();
}

// 중국 스테이지 초기화
function initializeChinaStage() {
    // 완료 상태 초기화 (다시 플레이 가능하도록)
    chinaCompleted = false;
    allUtensilsPlaced = false;
    
    // 배치된 아이템 초기화
    Object.keys(placedItems).forEach(key => delete placedItems[key]);
    
    // 이전 타이핑 인터벌 정리 (일본 스테이지에서 남아있을 수 있음)
    if (currentTypingInterval) {
        clearInterval(currentTypingInterval);
        currentTypingInterval = null;
    }
    
    // 이전 콜백 초기화
    onNextCallback = null;
    
    // 일본 스테이지 말풍선 숨기기
    const japanSpeechBubble = document.getElementById('speech-bubble');
    if (japanSpeechBubble) {
        japanSpeechBubble.classList.remove('show');
    }
    
    // grab 이미지 제거
    const grabImage = document.getElementById('grab-image-china');
    if (grabImage) {
        grabImage.remove();
    }
    
    // 손 이미지 다시 표시
    const handElement = document.getElementById('hand-draggable-china');
    if (handElement) {
        handElement.style.display = 'block';
    }
    
    // 정보 메뉴 닫기
    closeChopsticksInfoMenuChina();
    closeUtensilHoldingInfoMenuChina();
    closeFoodOrderInfoMenuChina();
    closeTableRotationInfoMenuChina();
    
    // 테이블 회전 체크 비활성화
    enableTableRotationCheck = false;
    
    // 밥그릇 드롭존 숨기기
    const riceBowlDropZone = document.getElementById('rice-bowl-drop-zone-china');
    if (riceBowlDropZone) {
        riceBowlDropZone.style.display = 'none';
    }
    
    // 중국 테이블 이미지 크기 조정
    adjustDropZonesToImageSizeChina();
    
    // 중국 테이블 이미지 1 드래그 회전 기능 초기화
    initializeChinaTable1Rotation();
    
    // 손 이미지 드래그 기능 초기화
    initializeHandDraggingChina();
    
    // 저장된 디버그 위치 적용
    setTimeout(() => {
        applyDebugPositions();
    }, 100);
    
    // 말풍선 초기화 및 시작 메시지 표시
    currentSpeechIndexChina = 0;
    showNextSpeechChina();
}

// 드롭 존 크기를 실제 이미지 사이즈에 맞게 조정하고 위치 설정
function adjustDropZonesToImageSize() {
    const imageMapping = {
        'drop-rice-bowl': 'dish.png',
        'drop-spoon': 'spoon.png',
        'drop-chopsticks': 'chopsticks.png'
    };
    
    // 모든 이미지 로드 후 위치 조정
    const images = {};
    let loadedCount = 0;
    const totalImages = Object.keys(imageMapping).length;
    
    Object.keys(imageMapping).forEach(dropZoneId => {
        const dropZone = document.getElementById(dropZoneId);
        if (!dropZone) return;
        
        const imageSrc = imageMapping[dropZoneId];
        const img = new Image();
        
        img.onload = function() {
            const naturalWidth = this.naturalWidth;
            const naturalHeight = this.naturalHeight;
            
            // 드롭 존 크기를 이미지 natural size의 80%로 설정 (20% 축소)
            const scaledWidth = naturalWidth * 0.8;
            const scaledHeight = naturalHeight * 0.8;
            dropZone.style.width = `${scaledWidth}px`;
            dropZone.style.height = `${scaledHeight}px`;
            
            // 이미지 정보 저장 (스케일된 크기)
            images[dropZoneId] = {
                width: scaledWidth,
                height: scaledHeight
            };
            
            loadedCount++;
            
            // 모든 이미지가 로드되면 위치 조정
            if (loadedCount === totalImages) {
                adjustDropZonePositions(images);
                // 드랍존 위치 설정 후 저장된 디버그 위치 적용
                setTimeout(() => {
                    applyDebugPositions();
                }, 50);
            }
        };
        
        img.src = imageSrc;
        
        // 이미 로드된 경우 즉시 실행
        if (img.complete) {
            const naturalWidth = img.naturalWidth;
            const naturalHeight = img.naturalHeight;
            const scaledWidth = naturalWidth * 0.8;
            const scaledHeight = naturalHeight * 0.8;
            dropZone.style.width = `${scaledWidth}px`;
            dropZone.style.height = `${scaledHeight}px`;
            
            images[dropZoneId] = {
                width: scaledWidth,
                height: scaledHeight
            };
            
            loadedCount++;
            
            if (loadedCount === totalImages) {
                adjustDropZonePositions(images);
                // 드랍존 위치 설정 후 저장된 디버그 위치 적용
                setTimeout(() => {
                    applyDebugPositions();
                }, 50);
            }
        }
    });
    
    // 상단 cheftable 이미지 크기 조정 (20% 축소)
    const topCheftable = document.querySelector('.top-cheftable');
    if (topCheftable) {
        const img = new Image();
        img.onload = function() {
            const naturalWidth = this.naturalWidth;
            const naturalHeight = this.naturalHeight;
            
            // 상단 cheftable 크기를 이미지 natural size의 80%로 설정 (20% 축소)
            topCheftable.style.width = `${naturalWidth * 0.75}px`;
            topCheftable.style.height = `${naturalHeight * 0.75}px`;
        };
        
        img.src = 'cheftable.png';
        
        // 이미 로드된 경우 즉시 실행
        if (img.complete) {
            const naturalWidth = img.naturalWidth;
            const naturalHeight = img.naturalHeight;
            topCheftable.style.width = `${naturalWidth * 0.8}px`;
            topCheftable.style.height = `${naturalHeight * 0.8}px`;
        }
    }
    
    // reciept 이미지 크기 조정 (20% 축소)
    const cardNapkin = document.querySelector('.card-napkin');
    if (cardNapkin) {
        const img = new Image();
        img.onload = function() {
            const naturalWidth = this.naturalWidth;
            const naturalHeight = this.naturalHeight;
            
            // reciept 크기를 이미지 natural size의 80%로 설정 (20% 축소)
            cardNapkin.style.width = `${naturalWidth * 0.7}px`;
            cardNapkin.style.height = `${naturalHeight * 0.7}px`;
        };
        
        img.src = 'reciepts.png';
        
        // 이미 로드된 경우 즉시 실행
        if (img.complete) {
            const naturalWidth = img.naturalWidth;
            const naturalHeight = img.naturalHeight;
            cardNapkin.style.width = `${naturalWidth * 0.8}px`;
            cardNapkin.style.height = `${naturalHeight * 0.8}px`;
        }
    }
    
    // 국그릇 이미지 크기 조정 (20% 축소)
    const soupBowlImage = document.querySelector('.soup-bowl-image img');
    if (soupBowlImage) {
        const img = new Image();
        img.onload = function() {
            const naturalWidth = this.naturalWidth;
            const naturalHeight = this.naturalHeight;
            
            // 국그릇 크기를 이미지 natural size의 80%로 설정 (20% 축소)
            soupBowlImage.style.width = `${naturalWidth * 0.8}px`;
            soupBowlImage.style.height = `${naturalHeight * 0.8}px`;
            
            // 밥그릇 위치를 기준으로 국그릇 위치 조정
            const riceBowl = document.getElementById('drop-rice-bowl');
            if (riceBowl) {
                const riceBowlRect = riceBowl.getBoundingClientRect();
                const tableSetting = document.querySelector('.table-setting');
                const tableSettingRect = tableSetting.getBoundingClientRect();
                
                const soupBowlContainer = soupBowlImage.parentElement;
                const riceBowlCenterX = riceBowlRect.left - tableSettingRect.left + riceBowlRect.width / 2;
                const soupBowlWidth = naturalWidth * 0.8;
                const soupBowlHeight = naturalHeight * 0.8;
                
                // 밥그릇 왼쪽에 배치 (간격 20px)
                soupBowlContainer.style.marginLeft = `-${riceBowlRect.width / 2 + soupBowlWidth / 2 + 20}px`;
            }
        };
        
        img.src = 'dish2.png';
        
        // 이미 로드된 경우 즉시 실행
        if (img.complete) {
            const naturalWidth = img.naturalWidth;
            const naturalHeight = img.naturalHeight;
            soupBowlImage.style.width = `${naturalWidth * 0.8}px`;
            soupBowlImage.style.height = `${naturalHeight * 0.8}px`;
        }
    }
}

// 드롭 존 위치를 이미지 크기에 맞게 조정하여 겹치지 않게 배치
function adjustDropZonePositions(images) {
    const riceBowl = document.getElementById('drop-rice-bowl');
    const spoon = document.getElementById('drop-spoon');
    const chopsticks = document.getElementById('drop-chopsticks');
    
    if (!riceBowl || !spoon || !chopsticks) return;
    
    // 저장된 디버그 위치 확인
    const savedPositions = JSON.parse(localStorage.getItem('debugPositions') || '{}');
    
    // 밥그릇은 중앙 (이미 CSS로 설정됨)
    const riceBowlWidth = images['drop-rice-bowl'].width;
    const riceBowlHeight = images['drop-rice-bowl'].height;
    const spoonWidth = images['drop-spoon'].width;
    const spoonHeight = images['drop-spoon'].height;
    const chopsticksWidth = images['drop-chopsticks'].width;
    const chopsticksHeight = images['drop-chopsticks'].height;
    
    // 숟가락: 밥그릇 오른쪽 (더 오른쪽으로 이동하여 젓가락 공간 확보)
    // 저장된 위치가 있으면 기본 위치 설정 건너뛰기
    if (!savedPositions['drop-zone-spoon-japan']) {
        spoon.style.left = '50%';
        spoon.style.top = '60%';
        spoon.style.transform = 'translate(0, -50%)';
        spoon.style.marginLeft = `${riceBowlWidth / 2 + spoonWidth / 2 + 40}px`; // 간격을 40px로 증가
    } else {
        // 저장된 위치가 있으면 margin 초기화
        spoon.style.marginLeft = '';
    }
    
    // 젓가락: 밥그릇 밑 (왼쪽으로 90도 회전, 밥그릇 바로 아래)
    // 저장된 위치가 있으면 기본 위치 설정 건너뛰기
    if (!savedPositions['drop-zone-chopsticks-japan']) {
        // 회전 후에는 width와 height가 바뀌므로, 회전된 상태의 크기를 고려
        // 회전 후 실제 높이는 원래 width가 됨
        const rotatedChopsticksHeight = chopsticksWidth; // 회전 후 높이
        const spacing = riceBowlHeight / 2 + rotatedChopsticksHeight / 2 + 5; // 간격을 5px로 줄임
        chopsticks.style.left = '50%';
        chopsticks.style.top = '30%';
        chopsticks.style.transform = 'translate(-50%, 0) rotate(-90deg)';
        chopsticks.style.marginTop = `${spacing}px`;
    } else {
        // 저장된 위치가 있으면 margin 초기화
        chopsticks.style.marginTop = '';
    }
}

// 드래그 앤 드롭 이벤트
document.querySelectorAll('.slot-item').forEach(item => {
    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragend', handleDragEnd);
});

document.querySelectorAll('.drop-zone').forEach(zone => {
    zone.addEventListener('dragover', handleDragOver);
    zone.addEventListener('dragleave', handleDragLeave);
    zone.addEventListener('drop', handleDrop);
});

// 밥그릇 드롭존 이벤트 설정
function setupRiceBowlDropZone() {
    const riceBowlDropZone = document.getElementById('rice-bowl-drop-zone');
    if (!riceBowlDropZone) return;
    
    const leftZone = riceBowlDropZone.querySelector('.rice-bowl-zone-left');
    const rightZone = riceBowlDropZone.querySelector('.rice-bowl-zone-right');
    
    // 드래그 오버 이벤트 (드롭존이 표시되어 있을 때만 작동)
    riceBowlDropZone.addEventListener('dragover', (e) => {
        // 드롭존이 숨겨져 있으면 이벤트 처리 안 함
        if (riceBowlDropZone.style.display === 'none') {
            return;
        }
        
        e.preventDefault();
        e.stopPropagation();
        
        const rect = riceBowlDropZone.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const isLeft = x < rect.width / 2;
        
        if (isLeft) {
            leftZone.classList.add('drag-over');
            rightZone.classList.remove('drag-over');
        } else {
            rightZone.classList.add('drag-over');
            leftZone.classList.remove('drag-over');
        }
    });
    
    riceBowlDropZone.addEventListener('dragleave', (e) => {
        if (!riceBowlDropZone.contains(e.relatedTarget)) {
            leftZone.classList.remove('drag-over');
            rightZone.classList.remove('drag-over');
        }
    });
    
    // 드롭 이벤트 처리
    leftZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleRiceBowlDrop(e, 'stick', leftZone);
    });
    
    rightZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleRiceBowlDrop(e, 'pick', rightZone);
    });
    
    riceBowlDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const rect = riceBowlDropZone.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const action = x < rect.width / 2 ? 'stick' : 'pick';
        const zone = x < rect.width / 2 ? leftZone : rightZone;
        handleRiceBowlDrop(e, action, zone);
    });
}

// 밥그릇 드롭존에 드롭 처리
function handleRiceBowlDrop(e, action, zone) {
    const source = e.dataTransfer.getData('source');
    let itemType, imageSrc;
    
    if (source === 'dropped') {
        if (!draggedDroppedItem) return;
        itemType = draggedDroppedItem.getAttribute('data-item-type');
        imageSrc = draggedDroppedItem.getAttribute('data-image-src');
    } else if (source === 'slot') {
        if (!draggedElement) return;
        itemType = draggedElement.getAttribute('data-item');
        imageSrc = draggedElement.getAttribute('data-image');
    } else {
        return;
    }
    
    // 숟가락이나 젓가락만 처리
    if (itemType !== 'spoon' && itemType !== 'chopsticks') {
        return;
    }
    
    // 꽂기로 드롭한 경우 메시지 표시
    if (action === 'stick') {
        showSpeechBubble('그러면 안 돼요!', 3000);
        showUtensilHoldingInfoMenu();
    } else if (action === 'pick') {
        // 집기로 드롭한 경우 메시지 표시하고 아이템은 유지
        showSpeechBubble('잘 드시니 기분이 좋네요', 3000);
        // 아이템은 사라지지 않도록 여기서 종료
        zone.classList.remove('drag-over');
        document.querySelectorAll('.rice-bowl-zone-left, .rice-bowl-zone-right').forEach(z => {
            z.classList.remove('drag-over');
        });
        
        // 밥그릇 드롭존 숨기기
        const riceBowlDropZone = document.getElementById('rice-bowl-drop-zone');
        if (riceBowlDropZone) {
            riceBowlDropZone.style.display = 'none';
        }
        return;
    }
    
    // 꽂기나 집기 어디로 드래그해도 정보 메뉴 표시 (꽂기일 때만)
    if (action === 'stick') {
        showUtensilHoldingInfoMenu();
    }
    
    // 드롭존에서 드래그 오버 클래스 제거
    zone.classList.remove('drag-over');
    document.querySelectorAll('.rice-bowl-zone-left, .rice-bowl-zone-right').forEach(z => {
        z.classList.remove('drag-over');
    });
    
    // 밥그릇 드롭존 숨기기
    const riceBowlDropZone = document.getElementById('rice-bowl-drop-zone');
    if (riceBowlDropZone) {
        riceBowlDropZone.style.display = 'none';
    }
    
    // 아이템은 사라지지 않도록 처리하지 않음
}

// 슬롯 메뉴에도 드롭 가능하도록 설정
document.querySelector('.slot-menu').addEventListener('dragover', function(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
});

document.querySelector('.slot-menu').addEventListener('drop', function(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    
    const source = e.dataTransfer.getData('source');
    if (source === 'dropped' && draggedDroppedItem) {
        const itemType = draggedDroppedItem.getAttribute('data-item-type');
        const dropZoneId = draggedDroppedItem.getAttribute('data-drop-zone');
        returnToInventory(draggedDroppedItem, dropZoneId, itemType);
    }
    
    return false;
});

let draggedElement = null;
let draggedDroppedItem = null;

function handleDragStart(e) {
    draggedElement = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
    
    // 셰프테이블에서 나타난 밥그릇인지 확인
    if (this.classList.contains('cheftable-rice-bowl')) {
        e.dataTransfer.setData('source', 'cheftable');
        // 손가락 가이드 제거
        const fingerGuide = document.getElementById('finger-guide');
        if (fingerGuide) {
            fingerGuide.remove();
        }
    } else {
        e.dataTransfer.setData('source', 'slot');
    }
    
    // 숟가락이나 젓가락을 드래그할 때 밥그릇 드롭존 표시 (수저를 다 놓은 후에만, grab 이미지가 없을 때만)
    const itemType = this.getAttribute('data-item');
    if (itemType === 'spoon' || itemType === 'chopsticks') {
        // 현재 스테이지 확인
        const currentStage = document.getElementById('japan-stage')?.classList.contains('active') ? 'japan' : 
                             document.getElementById('china-stage')?.classList.contains('active') ? 'china' : 'japan';
        
        if (currentStage === 'japan') {
            const riceBowlDropZone = document.getElementById('rice-bowl-drop-zone');
            const grabImage = document.getElementById('grab-image');
            // grab 이미지가 없고, 수저를 다 놓은 후에만 드롭존 표시
            if (riceBowlDropZone && allUtensilsPlaced && !grabImage) {
                riceBowlDropZone.style.display = 'flex';
                // 손을 먼저 쓰지 않고 수저를 드래그했을 때 메시지 표시
                showSpeechBubble('그릇을 들고 먹는게 좋아요', 3000);
            }
        } else {
            const riceBowlDropZone = document.getElementById('rice-bowl-drop-zone-china');
            const grabImage = document.getElementById('grab-image-china');
            // grab 이미지가 없고, 수저를 다 놓은 후에만 드롭존 표시
            if (riceBowlDropZone && allUtensilsPlaced && !grabImage) {
                riceBowlDropZone.style.display = 'flex';
                // 손을 먼저 쓰지 않고 수저를 드래그했을 때 메시지 표시
                showSpeechBubbleChina('그릇을 들고 먹는게 좋아요', 3000);
            }
        }
    }
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    document.querySelectorAll('.drop-zone').forEach(zone => {
        zone.classList.remove('drag-over');
    });
    
    // 밥그릇 드롭존 숨기기
    const riceBowlDropZone = document.getElementById('rice-bowl-drop-zone');
    if (riceBowlDropZone) {
        riceBowlDropZone.style.display = 'none';
    }
    document.querySelectorAll('.rice-bowl-zone-left, .rice-bowl-zone-right').forEach(zone => {
        zone.classList.remove('drag-over');
    });
}

// 드롭된 아이템 드래그 시작
function handleDroppedItemDragStart(e) {
    draggedDroppedItem = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('source', 'dropped');
    e.dataTransfer.setData('item-type', this.getAttribute('data-item-type'));
    e.dataTransfer.setData('image-src', this.getAttribute('data-image-src'));
    e.dataTransfer.setData('drop-zone', this.getAttribute('data-drop-zone'));
    
    // 숟가락이나 젓가락을 드래그할 때 밥그릇 드롭존 표시 (수저를 다 놓은 후에만, grab 이미지가 없을 때만)
    const itemType = this.getAttribute('data-item-type');
    if (itemType === 'spoon' || itemType === 'chopsticks') {
        // 현재 스테이지 확인
        const currentStage = document.getElementById('japan-stage')?.classList.contains('active') ? 'japan' : 
                             document.getElementById('china-stage')?.classList.contains('active') ? 'china' : 'japan';
        
        if (currentStage === 'japan') {
            const riceBowlDropZone = document.getElementById('rice-bowl-drop-zone');
            const grabImage = document.getElementById('grab-image');
            // grab 이미지가 없고, 수저를 다 놓은 후에만 드롭존 표시
            if (riceBowlDropZone && allUtensilsPlaced && !grabImage) {
                riceBowlDropZone.style.display = 'flex';
                // 손을 먼저 쓰지 않고 수저를 드래그했을 때 메시지 표시
                showSpeechBubble('그릇을 들고 먹는게 좋아요', 3000);
            }
        } else {
            const riceBowlDropZone = document.getElementById('rice-bowl-drop-zone-china');
            const grabImage = document.getElementById('grab-image-china');
            // grab 이미지가 없고, 수저를 다 놓은 후에만 드롭존 표시
            if (riceBowlDropZone && allUtensilsPlaced && !grabImage) {
                riceBowlDropZone.style.display = 'flex';
                // 손을 먼저 쓰지 않고 수저를 드래그했을 때 메시지 표시
                showSpeechBubbleChina('그릇을 들고 먹는게 좋아요', 3000);
            }
        }
    }
}

// 드롭된 아이템 드래그 종료
function handleDroppedItemDragEnd(e) {
    this.classList.remove('dragging');
    document.querySelectorAll('.drop-zone').forEach(zone => {
        zone.classList.remove('drag-over');
    });
    draggedDroppedItem = null;
    
    // 밥그릇 드롭존 숨기기
    const riceBowlDropZone = document.getElementById('rice-bowl-drop-zone');
    if (riceBowlDropZone) {
        riceBowlDropZone.style.display = 'none';
    }
    document.querySelectorAll('.rice-bowl-zone-left, .rice-bowl-zone-right').forEach(zone => {
        zone.classList.remove('drag-over');
    });
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    this.classList.add('drag-over');
    return false;
}

function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    
    this.classList.remove('drag-over');
    
    const source = e.dataTransfer.getData('source');
    let itemType, imageSrc, originalDropZone;
    
    if (source === 'dropped') {
        // 드롭된 아이템에서 드래그한 경우
        if (!draggedDroppedItem) return;
        
        itemType = draggedDroppedItem.getAttribute('data-item-type');
        imageSrc = draggedDroppedItem.getAttribute('data-image-src');
        originalDropZone = draggedDroppedItem.getAttribute('data-drop-zone');
        
        // 같은 드롭 존에 드롭하면 무시
        if (this.id === originalDropZone) {
            return false;
        }
        
        // 원래 드롭 존에서 아이템 제거
        const originalZone = document.getElementById(originalDropZone);
        if (originalZone) {
            originalZone.classList.remove('filled', 'correct');
            if (placedItems[itemType] === originalDropZone) {
                delete placedItems[itemType];
            }
        }
        draggedDroppedItem.remove();
    } else if (source === 'slot' || source === 'cheftable') {
        // 슬롯 또는 셰프테이블에서 드래그한 경우
        if (!draggedElement) return;
        
        itemType = draggedElement.getAttribute('data-item');
        imageSrc = draggedElement.getAttribute('data-image');
    } else {
        return false;
    }
    
    const dropZoneId = this.id;
    const currentStage = document.getElementById('japan-stage')?.classList.contains('active') ? 'japan' : 
                         document.getElementById('china-stage')?.classList.contains('active') ? 'china' : 'japan';
    const correctZoneId = currentStage === 'china' ? correctPositionsChina[itemType] : correctPositions[itemType];
    
    // 이미 다른 아이템이 있는지 확인
    if (this.classList.contains('filled')) {
        // 이미 아이템이 있으면 원래 위치로 복구 (드롭된 아이템인 경우)
        if (source === 'dropped' && originalDropZone) {
            const originalZone = document.getElementById(originalDropZone);
            if (originalZone) {
                placeItemInZone(itemType, imageSrc, originalZone, originalDropZone, correctPositions[itemType]);
            }
        }
        return false;
    }
    
    // 아이템을 드롭 존에 배치
    const slotElement = (source === 'slot' || source === 'cheftable') ? draggedElement : null;
    placeItemInZone(itemType, imageSrc, this, dropZoneId, correctZoneId, slotElement);
    
    // 셰프테이블에서 온 경우 드롭 성공 후 제거
    if (source === 'cheftable' && draggedElement && draggedElement.classList.contains('cheftable-rice-bowl')) {
        setTimeout(() => {
            draggedElement.remove();
        }, 100);
    }
    
    return false;
}

// 아이템을 드롭 존에 배치하는 공통 함수
function placeItemInZone(itemType, imageSrc, dropZone, dropZoneId, correctZoneId, slotElement) {
    // 밥그릇이 배치되면 손가락 가이드 제거
    if (itemType === 'rice-bowl') {
        const fingerGuide = document.getElementById('finger-guide');
        if (fingerGuide) {
            fingerGuide.remove();
        }
    }
    const droppedItem = document.createElement('div');
    droppedItem.className = 'dropped-item';
    
    // 실제 이미지 태그 생성
    const img = document.createElement('img');
    img.style.display = 'block';
    
    // 이미지 크기 설정 함수 (드롭 존이 이미지 크기의 80%로 맞춰져 있으므로 80% 사용)
    const setImageSize = function() {
        const naturalWidth = img.naturalWidth;
        const naturalHeight = img.naturalHeight;
        
        // 원본 크기의 80%로 설정 (20% 축소)
        img.style.width = `${naturalWidth * 0.8}px`;
        img.style.height = `${naturalHeight * 0.8}px`;
    };
    
    // 이미지 로드 이벤트 설정
    img.onload = setImageSize;
    
    // src 설정 (이미 캐시된 경우를 위해 onload 후에도 확인)
    img.src = imageSrc;
    
    // 이미 로드된 경우 즉시 실행
    if (img.complete) {
        setTimeout(setImageSize, 0);
    }
    
    droppedItem.appendChild(img);
    
    // 드롭된 아이템을 드래그 가능하게 설정
    droppedItem.draggable = true;
    droppedItem.setAttribute('data-drop-zone', dropZoneId);
    droppedItem.setAttribute('data-item-type', itemType);
    droppedItem.setAttribute('data-image-src', imageSrc);
    
    // 드롭된 아이템 드래그 이벤트
    droppedItem.addEventListener('dragstart', handleDroppedItemDragStart);
    droppedItem.addEventListener('dragend', handleDroppedItemDragEnd);
    
    // 드롭된 아이템에 클릭 이벤트 추가 (인벤토리로 되돌리기)
    droppedItem.addEventListener('click', function(e) {
        // 드래그가 아닌 클릭인 경우에만 실행
        if (!this.classList.contains('dragging')) {
            returnToInventory(this, dropZoneId, itemType);
        }
    });
    
    dropZone.appendChild(droppedItem);
    dropZone.classList.add('filled');
    
    // 슬롯에서 아이템 제거 (시각적으로만) - 슬롯에서 온 경우에만
    if (slotElement) {
        slotElement.style.opacity = '0.3';
        slotElement.style.pointerEvents = 'none';
    }
    
    // 정답 체크
    if (dropZoneId === correctZoneId) {
        dropZone.classList.add('correct');
        placedItems[itemType] = dropZoneId;
        
        // 말풍선에 피드백 표시
        const itemNames = {
            'rice-bowl': '밥그릇',
            'spoon': '숟가락',
            'chopsticks': '젓가락'
        };
        
        // 현재 스테이지 확인
        const currentStage = document.getElementById('japan-stage')?.classList.contains('active') ? 'japan' : 
                             document.getElementById('china-stage')?.classList.contains('active') ? 'china' : 'japan';
        
        // 밥그릇이 올바르게 배치된 경우 특별한 대사 표시 (예외처리: "잘했어요!" 대사 생략)
        if (itemType === 'rice-bowl') {
            if (currentStage === 'japan') {
                // "잘했어요!" 대사 없이 바로 "수저를 놓아볼까요?" 표시
                // 밥그릇 드롭존은 숨김 (수저를 다 놓을 때까지 표시 안 함)
                const riceBowlDropZone = document.getElementById('rice-bowl-drop-zone');
                if (riceBowlDropZone) {
                    riceBowlDropZone.style.display = 'none';
                }
                showSpeechBubble('수저를 놓아볼까요?', 3000);
                highlightUtensils();
            } else {
                // "잘했어요!" 대사 없이 바로 "수저를 놓아볼까요?" 표시
                // 밥그릇 드롭존은 숨김 (수저를 다 놓을 때까지 표시 안 함)
                const riceBowlDropZone = document.getElementById('rice-bowl-drop-zone-china');
                if (riceBowlDropZone) {
                    riceBowlDropZone.style.display = 'none';
                }
                showSpeechBubbleChina('수저를 놓아볼까요?', 3000);
                highlightUtensilsChina();
            }
        } else {
            // 숟가락이나 젓가락이 올바르게 배치되면 강조 애니메이션 제거
            if (itemType === 'spoon' || itemType === 'chopsticks') {
                if (currentStage === 'japan') {
                    stopHighlightUtensils();
                } else {
                    stopHighlightUtensilsChina();
                }
            }
            
            // 젓가락이 올바르게 배치된 경우 젓가락 배치 예절 슬라이드 창 표시
            if (itemType === 'chopsticks') {
                if (currentStage === 'japan') {
                    showChopsticksInfoMenu();
                } else {
                    showChopsticksInfoMenuChina();
                }
            }
            
            // "잘했어요!" 메시지 표시
            if (currentStage === 'japan') {
                showSpeechBubble('잘했어요!', 2000);
            } else {
                showSpeechBubbleChina('잘했어요!', 2000);
            }
        }
        
        // 모든 아이템이 올바르게 배치되었는지 확인 (딜레이를 주어 메시지가 겹치지 않도록)
        if (currentStage === 'japan') {
            // "잘했어요!" 메시지가 표시된 경우, 그 메시지가 사라진 후에 체크
            if (itemType === 'spoon' || itemType === 'chopsticks') {
                setTimeout(() => {
                    checkAllCorrect();
                }, 5000); // "잘했어요!" 메시지(2000ms) + 여유시간(3000ms)
            } else {
                checkAllCorrect();
            }
        } else if (currentStage === 'china') {
            // "잘했어요!" 메시지가 표시된 경우, 그 메시지가 사라진 후에 체크
            if (itemType === 'spoon' || itemType === 'chopsticks') {
                setTimeout(() => {
                    checkAllCorrectChina();
                }, 5000); // "잘했어요!" 메시지(2000ms) + 여유시간(3000ms)
            } else {
                checkAllCorrectChina();
            }
        }
    } else {
        // 잘못된 위치에 배치된 경우 - 아이템은 그대로 두고 말풍선으로 알림
        const itemNames = {
            'rice-bowl': '밥그릇',
            'spoon': '숟가락',
            'chopsticks': '젓가락'
        };
        
        // 현재 스테이지 확인
        const currentStage = document.getElementById('japan-stage')?.classList.contains('active') ? 'japan' : 
                             document.getElementById('china-stage')?.classList.contains('active') ? 'china' : 'japan';
        
        // 젓가락을 숟가락 위치에 잘못 배치한 경우 특별 처리
        if (itemType === 'chopsticks' && (dropZoneId === 'drop-spoon' || dropZoneId === 'drop-spoon-china')) {
            if (currentStage === 'japan') {
                showSpeechBubble('젓가락을 세로로 두면 안 돼요', 3000);
                showChopsticksInfoMenu();
            } else {
                showSpeechBubbleChina('젓가락을 세로로 두면 안 돼요', 3000);
                showChopsticksInfoMenuChina();
            }
        } else {
            if (currentStage === 'japan') {
                showSpeechBubble(`${itemNames[itemType]}을 잘못된 위치에 배치했습니다. 올바른 위치로 옮겨주세요.`, 3000);
            } else {
                showSpeechBubbleChina(`${itemNames[itemType]}을 잘못된 위치에 배치했습니다. 올바른 위치로 옮겨주세요.`, 3000);
            }
        }
        
        // 슬롯에서 온 경우에만 슬롯 아이템 비활성화 유지 (이미 처리됨)
    }
}

// 드롭된 아이템을 인벤토리로 되돌리기
function returnToInventory(droppedItem, dropZoneId, itemType) {
    const dropZone = document.getElementById(dropZoneId);
    if (!dropZone) return;
    
    // 드롭 존에서 아이템 제거
    dropZone.classList.remove('filled', 'correct');
    droppedItem.remove();
    
    // 배치된 아이템 추적에서 제거
    if (placedItems[itemType] === dropZoneId) {
        delete placedItems[itemType];
    }
    
    // 슬롯 아이템 다시 활성화
    const slotItem = document.querySelector(`.slot-item[data-item="${itemType}"]`);
    if (slotItem) {
        slotItem.style.opacity = '1';
        slotItem.style.pointerEvents = 'auto';
    }
}

// 모든 아이템이 올바르게 배치되었는지 확인
let allUtensilsPlaced = false;

function checkAllCorrect() {
    const allItems = Object.keys(correctPositions);
    const allCorrect = allItems.every(item => placedItems[item] === correctPositions[item]);
    
    if (allCorrect && Object.keys(placedItems).length === allItems.length && !allUtensilsPlaced) {
        allUtensilsPlaced = true;
        japanCompleted = true;
        updateStamp('japan');
        setTimeout(() => {
            // 밥그릇 드롭존은 숨김 상태 유지 (수저 드래그 시에만 표시됨)
            const riceBowlDropZone = document.getElementById('rice-bowl-drop-zone');
            if (riceBowlDropZone) {
                riceBowlDropZone.style.display = 'none';
            }
            showSpeechBubble('식사를 시작해 볼까요?', 3000);
            highlightHandAndUtensils();
        }, 300);
    }
}

function checkAllCorrectChina() {
    const allItems = Object.keys(correctPositionsChina);
    const allCorrect = allItems.every(item => placedItems[item] === correctPositionsChina[item]);
    
    if (allCorrect && Object.keys(placedItems).length === allItems.length && !allUtensilsPlaced) {
        allUtensilsPlaced = true;
        chinaCompleted = true;
        updateStamp('china');
        setTimeout(() => {
            // 밥그릇 드롭존은 숨김 상태 유지 (수저 드래그 시에만 표시됨)
            const riceBowlDropZone = document.getElementById('rice-bowl-drop-zone-china');
            if (riceBowlDropZone) {
                riceBowlDropZone.style.display = 'none';
            }
            showSpeechBubbleChina('식사를 시작해 볼까요?', 3000);
            highlightHandAndUtensilsChina();
        }, 300);
    }
}

function highlightHandAndUtensilsChina() {
    const handElement = document.getElementById('hand-draggable-china');
    const spoonItem = document.querySelector('#china-stage .slot-item[data-item="spoon"]');
    const chopsticksItem = document.querySelector('#china-stage .slot-item[data-item="chopsticks"]');
    const spoonDropZone = document.getElementById('drop-spoon-china');
    const chopsticksDropZone = document.getElementById('drop-chopsticks-china');
    
    if (handElement) handElement.classList.add('highlight-pulse');
    if (spoonItem) spoonItem.classList.add('highlight-pulse');
    if (chopsticksItem) chopsticksItem.classList.add('highlight-pulse');
    if (spoonDropZone) spoonDropZone.classList.add('highlight-pulse');
    if (chopsticksDropZone) chopsticksDropZone.classList.add('highlight-pulse');
}

// 손, 숟가락, 젓가락 하이라이트
function highlightHandAndUtensils() {
    const handElement = document.getElementById('hand-draggable');
    const spoonItem = document.querySelector('.slot-item[data-item="spoon"]');
    const chopsticksItem = document.querySelector('.slot-item[data-item="chopsticks"]');
    const spoonDropZone = document.getElementById('drop-spoon');
    const chopsticksDropZone = document.getElementById('drop-chopsticks');
    
    if (handElement) {
        handElement.classList.add('highlight-pulse');
    }
    if (spoonItem) {
        spoonItem.classList.add('highlight-pulse');
    }
    if (chopsticksItem) {
        chopsticksItem.classList.add('highlight-pulse');
    }
    if (spoonDropZone) {
        spoonDropZone.classList.add('highlight-pulse');
    }
    if (chopsticksDropZone) {
        chopsticksDropZone.classList.add('highlight-pulse');
    }
}

// 알림 표시
function showAlert(message) {
    const modal = document.getElementById('alert-modal');
    const messageEl = document.getElementById('alert-message');
    messageEl.textContent = message;
    modal.classList.add('active');
}

// 알림 닫기
document.getElementById('close-alert').addEventListener('click', () => {
    document.getElementById('alert-modal').classList.remove('active');
    
    // 완료된 경우에도 지도로 자동 이동하지 않음 (사용자가 직접 선택할 수 있도록)
});

// 스탬프 업데이트
function updateStamp(country) {
    if (country === 'japan' && japanCompleted) {
        const stamp = document.getElementById('japan-stamp');
        const completeLabel = document.getElementById('japan-complete');
        if (stamp) stamp.style.display = 'block';
        if (completeLabel) completeLabel.style.display = 'inline';
    } else if (country === 'china' && chinaCompleted) {
        const stamp = document.getElementById('china-stamp');
        const completeLabel = document.getElementById('china-complete');
        if (stamp) stamp.style.display = 'block';
        if (completeLabel) completeLabel.style.display = 'inline';
    }
}

// 모달 외부 클릭 시 닫기
document.getElementById('alert-modal').addEventListener('click', (e) => {
    if (e.target.id === 'alert-modal') {
        document.getElementById('alert-modal').classList.remove('active');
    }
});

// 숟가락과 젓가락 강조 애니메이션 함수
function highlightUtensils() {
    const spoonItem = document.querySelector('.slot-item[data-item="spoon"]');
    const chopsticksItem = document.querySelector('.slot-item[data-item="chopsticks"]');
    
    if (spoonItem) {
        spoonItem.classList.add('highlight-pulse');
    }
    if (chopsticksItem) {
        chopsticksItem.classList.add('highlight-pulse');
    }
}

// 숟가락과 젓가락 강조 애니메이션 제거 함수
function stopHighlightUtensils() {
    const spoonItem = document.querySelector('.slot-item[data-item="spoon"]');
    const chopsticksItem = document.querySelector('.slot-item[data-item="chopsticks"]');
    
    if (spoonItem) {
        spoonItem.classList.remove('highlight-pulse');
    }
    if (chopsticksItem) {
        chopsticksItem.classList.remove('highlight-pulse');
    }
}

function highlightUtensilsChina() {
    const spoonItem = document.querySelector('#china-stage .slot-item[data-item="spoon"]');
    const chopsticksItem = document.querySelector('#china-stage .slot-item[data-item="chopsticks"]');
    
    if (spoonItem) {
        spoonItem.classList.add('highlight-pulse');
    }
    if (chopsticksItem) {
        chopsticksItem.classList.add('highlight-pulse');
    }
}

function stopHighlightUtensilsChina() {
    const spoonItem = document.querySelector('#china-stage .slot-item[data-item="spoon"]');
    const chopsticksItem = document.querySelector('#china-stage .slot-item[data-item="chopsticks"]');
    
    if (spoonItem) {
        spoonItem.classList.remove('highlight-pulse');
    }
    if (chopsticksItem) {
        chopsticksItem.classList.remove('highlight-pulse');
    }
}

// 젓가락 정보 메뉴 표시 함수
function showChopsticksInfoMenu() {
    const infoMenu = document.getElementById('chopsticks-info-menu');
    if (!infoMenu) return;
    
    // 오른쪽에서 등장하는 애니메이션
    infoMenu.style.display = 'block';
    infoMenu.style.right = '-400px'; // 초기 위치 (화면 밖)
    
    // 애니메이션 시작
    setTimeout(() => {
        infoMenu.style.transition = 'right 0.5s ease-out';
        infoMenu.style.right = '0';
    }, 50);
}

// 젓가락 정보 메뉴 닫기 함수
function closeChopsticksInfoMenu() {
    const infoMenu = document.getElementById('chopsticks-info-menu');
    if (!infoMenu) return;
    
    // 오른쪽으로 사라지는 애니메이션
    infoMenu.style.transition = 'right 0.5s ease-in';
    infoMenu.style.right = '-400px';
    
    // 애니메이션 완료 후 숨김
    setTimeout(() => {
        infoMenu.style.display = 'none';
    }, 500);
}

// 식기 손으로 들고 먹는 것 정보 메뉴 표시 함수
function showUtensilHoldingInfoMenu() {
    const infoMenu = document.getElementById('utensil-holding-info-menu');
    if (!infoMenu) return;
    
    // 오른쪽에서 등장하는 애니메이션
    infoMenu.style.display = 'block';
    infoMenu.style.right = '-400px'; // 초기 위치 (화면 밖)
    
    // 애니메이션 시작
    setTimeout(() => {
        infoMenu.style.transition = 'right 0.5s ease-out';
        infoMenu.style.right = '0';
    }, 50);
}

// 식기 손으로 들고 먹는 것 정보 메뉴 닫기 함수
function closeUtensilHoldingInfoMenu() {
    const infoMenu = document.getElementById('utensil-holding-info-menu');
    if (!infoMenu) return;
    
    // 오른쪽으로 사라지는 애니메이션
    infoMenu.style.transition = 'right 0.5s ease-in';
    infoMenu.style.right = '-400px';
    
    // 애니메이션 완료 후 숨김
    setTimeout(() => {
        infoMenu.style.display = 'none';
    }, 500);
}

// 손 이미지 드래그 기능 초기화
function initializeHandDragging() {
    const handElement = document.getElementById('hand-draggable');
    if (!handElement) return;
    
    const handImage = handElement.querySelector('img');
    if (!handImage) return;
    
    // 이미지 크기 설정
    const setImageSize = function() {
        const naturalWidth = handImage.naturalWidth;
        const naturalHeight = handImage.naturalHeight;
        const scaledWidth = naturalWidth * 0.8;
        const scaledHeight = naturalHeight * 0.8;
        handImage.style.width = `${scaledWidth}px`;
        handImage.style.height = `${scaledHeight}px`;
    };
    
    handImage.onload = setImageSize;
    if (handImage.complete) {
        setImageSize();
    }
    
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let currentY = 0;
    let rotation = 0;
    
    // 마우스 다운 이벤트
    handElement.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        
        const rect = handElement.getBoundingClientRect();
        currentX = rect.left;
        currentY = rect.top;
        
        handElement.style.transition = 'none';
        e.preventDefault();
    });
    
    // 마우스 이동 이벤트
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        // 위치 업데이트
        const newX = currentX + deltaX;
        const newY = currentY + deltaY;
        
        handElement.style.left = `${newX}px`;
        handElement.style.top = `${newY}px`;
        handElement.style.bottom = 'auto';
        
        // 드래그 방향에 따라 회전 각도 계산 (거꾸로 뒤집히지 않도록 제한)
        let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
        // 각도를 -45도에서 45도 사이로 제한
        if (angle > 45) {
            angle = 45;
        } else if (angle < -45) {
            angle = -45;
        }
        rotation = angle;
        handImage.style.transform = `rotate(${rotation}deg)`;
        
        // 밥그릇 드롭존과의 상호작용 체크
        if (allUtensilsPlaced) {
            const riceBowlDropZone = document.getElementById('drop-rice-bowl');
            const grabText = document.getElementById('grab-text');
            
            if (riceBowlDropZone && grabText) {
                const handRect = handElement.getBoundingClientRect();
                const riceBowlRect = riceBowlDropZone.getBoundingClientRect();
                
                // 손이 밥그릇 드롭존 안에 있는지 확인
                const isOverRiceBowl = (
                    handRect.left < riceBowlRect.right &&
                    handRect.right > riceBowlRect.left &&
                    handRect.top < riceBowlRect.bottom &&
                    handRect.bottom > riceBowlRect.top
                );
                
                if (isOverRiceBowl) {
                    riceBowlDropZone.style.border = '3px dashed #4CAF50';
                    riceBowlDropZone.style.background = 'rgba(76, 175, 80, 0.2)';
                    grabText.style.display = 'block';
                } else {
                    riceBowlDropZone.style.border = '';
                    riceBowlDropZone.style.background = '';
                    grabText.style.display = 'none';
                }
            }
        }
    });
    
    // 마우스 업 이벤트
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            handElement.style.transition = 'transform 0.2s ease-out';
            
            // 밥그릇 드롭존 안에서 드래그가 끝났는지 확인
            if (allUtensilsPlaced) {
                const riceBowlDropZone = document.getElementById('drop-rice-bowl');
                const grabText = document.getElementById('grab-text');
                
                if (riceBowlDropZone && grabText && grabText.style.display === 'block') {
                    // 손과 밥그릇 이미지를 grab.png로 교체
                    replaceWithGrabImage();
                }
            }
            
            // 드롭존 스타일 초기화
            const riceBowlDropZone = document.getElementById('drop-rice-bowl');
            if (riceBowlDropZone) {
                riceBowlDropZone.style.border = '';
                riceBowlDropZone.style.background = '';
            }
            const grabText = document.getElementById('grab-text');
            if (grabText) {
                grabText.style.display = 'none';
            }
        }
    });
    
    // 터치 이벤트 지원
    handElement.addEventListener('touchstart', (e) => {
        isDragging = true;
        const touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        
        const rect = handElement.getBoundingClientRect();
        currentX = rect.left;
        currentY = rect.top;
        
        handElement.style.transition = 'none';
        e.preventDefault();
    });
    
    document.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        const touch = e.touches[0];
        
        const deltaX = touch.clientX - startX;
        const deltaY = touch.clientY - startY;
        
        const newX = currentX + deltaX;
        const newY = currentY + deltaY;
        
        handElement.style.left = `${newX}px`;
        handElement.style.top = `${newY}px`;
        handElement.style.bottom = 'auto';
        
        let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
        // 각도를 -45도에서 45도 사이로 제한
        if (angle > 45) {
            angle = 45;
        } else if (angle < -45) {
            angle = -45;
        }
        rotation = angle;
        handImage.style.transform = `rotate(${rotation}deg)`;
        
        // 밥그릇 드롭존과의 상호작용 체크
        if (allUtensilsPlaced) {
            const riceBowlDropZone = document.getElementById('drop-rice-bowl');
            const grabText = document.getElementById('grab-text');
            
            if (riceBowlDropZone && grabText) {
                const handRect = handElement.getBoundingClientRect();
                const riceBowlRect = riceBowlDropZone.getBoundingClientRect();
                
                const isOverRiceBowl = (
                    handRect.left < riceBowlRect.right &&
                    handRect.right > riceBowlRect.left &&
                    handRect.top < riceBowlRect.bottom &&
                    handRect.bottom > riceBowlRect.top
                );
                
                if (isOverRiceBowl) {
                    riceBowlDropZone.style.border = '3px dashed #4CAF50';
                    riceBowlDropZone.style.background = 'rgba(76, 175, 80, 0.2)';
                    grabText.style.display = 'block';
                } else {
                    riceBowlDropZone.style.border = '';
                    riceBowlDropZone.style.background = '';
                    grabText.style.display = 'none';
                }
            }
        }
        
        e.preventDefault();
    });
    
    document.addEventListener('touchend', () => {
        if (isDragging) {
            isDragging = false;
            handElement.style.transition = 'transform 0.2s ease-out';
            
            // 밥그릇 드롭존 안에서 드래그가 끝났는지 확인
            if (allUtensilsPlaced) {
                const riceBowlDropZone = document.getElementById('drop-rice-bowl');
                const grabText = document.getElementById('grab-text');
                
                if (riceBowlDropZone && grabText && grabText.style.display === 'block') {
                    // 손과 밥그릇 이미지를 grab.png로 교체
                    replaceWithGrabImage();
                }
            }
            
            // 드롭존 스타일 초기화
            const riceBowlDropZone = document.getElementById('drop-rice-bowl');
            if (riceBowlDropZone) {
                riceBowlDropZone.style.border = '';
                riceBowlDropZone.style.background = '';
            }
            const grabText = document.getElementById('grab-text');
            if (grabText) {
                grabText.style.display = 'none';
            }
        }
    });
}

// 손과 밥그릇 이미지를 grab.png로 교체
function replaceWithGrabImage() {
    const handElement = document.getElementById('hand-draggable');
    const riceBowlDropZone = document.getElementById('drop-rice-bowl');
    const riceBowlItem = riceBowlDropZone ? riceBowlDropZone.querySelector('.dropped-item') : null;
    
    // 기존 손과 밥그릇 이미지 숨기기
    if (handElement) {
        handElement.style.display = 'none';
    }
    if (riceBowlItem) {
        riceBowlItem.style.display = 'none';
    }
    
    // grab 이미지 새로 생성
    const tableSetting = document.querySelector('.table-setting');
    if (!tableSetting) return;
    
    // 이미 grab 이미지가 있으면 제거
    const existingGrab = document.getElementById('grab-image');
    if (existingGrab) {
        existingGrab.remove();
    }
    
    const grabImageContainer = document.createElement('div');
    grabImageContainer.id = 'grab-image';
    grabImageContainer.className = 'grab-image-container';
    
    const grabImg = document.createElement('img');
    grabImg.src = 'grab.png';
    grabImg.alt = 'grab';
    
    // 이미지 크기 설정 (90%로 설정)
    grabImg.onload = function() {
        const naturalWidth = this.naturalWidth;
        const naturalHeight = this.naturalHeight;
        // 90% 크기로 설정
        const scaledWidth = naturalWidth * 0.9;
        const scaledHeight = naturalHeight * 0.9;
        this.style.width = `${scaledWidth}px`;
        this.style.height = `${scaledHeight}px`;
    };
    
    if (grabImg.complete) {
        const naturalWidth = grabImg.naturalWidth;
        const naturalHeight = grabImg.naturalHeight;
        const scaledWidth = naturalWidth * 0.9;
        const scaledHeight = naturalHeight * 0.9;
        grabImg.style.width = `${scaledWidth}px`;
        grabImg.style.height = `${scaledHeight}px`;
    }
    
    grabImageContainer.appendChild(grabImg);
    
    // grab 이미지 드롭존 생성 (반으로 나뉨)
    const grabDropZone = document.createElement('div');
    grabDropZone.id = 'grab-drop-zone';
    grabDropZone.className = 'grab-drop-zone';
    
    // 왼쪽 영역 (꽂기)
    const leftZone = document.createElement('div');
    leftZone.className = 'grab-zone-left';
    leftZone.textContent = '꽂기';
    leftZone.setAttribute('data-action', 'stick');
    
    // 오른쪽 영역 (집기)
    const rightZone = document.createElement('div');
    rightZone.className = 'grab-zone-right';
    rightZone.textContent = '집기';
    rightZone.setAttribute('data-action', 'pick');
    
    grabDropZone.appendChild(leftZone);
    grabDropZone.appendChild(rightZone);
    grabImageContainer.appendChild(grabDropZone);
    
    tableSetting.appendChild(grabImageContainer);
    
    // 위치 설정 (밥그릇 드롭존 위치에 정확히 배치)
    const riceBowlRect = riceBowlDropZone ? riceBowlDropZone.getBoundingClientRect() : null;
    const tableSettingRect = tableSetting.getBoundingClientRect();
    
    if (riceBowlRect) {
        // 밥그릇 드롭존의 정확한 위치에 배치 (왼쪽으로 더 이동)
        grabImageContainer.style.left = `${riceBowlRect.left - tableSettingRect.left + riceBowlRect.width / 2 - 140}px`;
        grabImageContainer.style.top = `${riceBowlRect.top - tableSettingRect.top + riceBowlRect.height / 2}px`;
        grabImageContainer.style.transform = 'translate(-50%, -50%)';
    } else {
        // 밥그릇 위치를 찾을 수 없으면 중앙에 배치
        grabImageContainer.style.left = '50%';
        grabImageContainer.style.top = '55%';
        grabImageContainer.style.transform = 'translate(-50%, -50%)';
    }
    
    // grab 드롭존에 드래그 이벤트 추가
    setupGrabDropZone(grabDropZone, leftZone, rightZone);
}

// grab 드롭존 설정
function setupGrabDropZone(grabDropZone, leftZone, rightZone) {
    // 숟가락과 젓가락 슬롯 아이템에 드래그 이벤트 추가
    const spoonItem = document.querySelector('.slot-item[data-item="spoon"]');
    const chopsticksItem = document.querySelector('.slot-item[data-item="chopsticks"]');
    
    // 드롭존이 숨겨진 상태로 시작
    grabDropZone.style.display = 'none';
    
    // 드래그 시작 시 grab 드롭존 표시
    const showGrabDropZone = (e) => {
        const itemType = e.target.closest('.slot-item')?.getAttribute('data-item');
        const droppedItem = e.target.closest('.dropped-item');
        const droppedItemType = droppedItem?.getAttribute('data-item-type');
        
        if (itemType === 'spoon' || itemType === 'chopsticks' || 
            droppedItemType === 'spoon' || droppedItemType === 'chopsticks') {
            grabDropZone.style.display = 'flex';
        }
    };
    
    // 드래그 종료 시 grab 드롭존 숨기기
    const hideGrabDropZone = () => {
        grabDropZone.style.display = 'none';
        leftZone.classList.remove('drag-over');
        rightZone.classList.remove('drag-over');
    };
    
    // 슬롯 아이템 드래그 이벤트
    [spoonItem, chopsticksItem].forEach(item => {
        if (item) {
            item.addEventListener('dragstart', showGrabDropZone);
            item.addEventListener('dragend', hideGrabDropZone);
        }
    });
    
    // grab 드롭존에 드래그 오버 이벤트
    grabDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const rect = grabDropZone.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const isLeft = x < rect.width / 2;
        
        if (isLeft) {
            leftZone.classList.add('drag-over');
            rightZone.classList.remove('drag-over');
        } else {
            rightZone.classList.add('drag-over');
            leftZone.classList.remove('drag-over');
        }
    });
    
    grabDropZone.addEventListener('dragleave', (e) => {
        if (!grabDropZone.contains(e.relatedTarget)) {
            leftZone.classList.remove('drag-over');
            rightZone.classList.remove('drag-over');
        }
    });
    
    // 드롭 이벤트 처리
    leftZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleGrabDrop(e, 'stick', leftZone);
    });
    
    rightZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleGrabDrop(e, 'pick', rightZone);
    });
    
    grabDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const rect = grabDropZone.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const action = x < rect.width / 2 ? 'stick' : 'pick';
        const zone = x < rect.width / 2 ? leftZone : rightZone;
        handleGrabDrop(e, action, zone);
    });
    
    // 전역 드래그 이벤트로 드롭된 아이템 감지
    document.addEventListener('dragstart', (e) => {
        const droppedItem = e.target.closest('.dropped-item');
        if (droppedItem) {
            const itemType = droppedItem.getAttribute('data-item-type');
            if (itemType === 'spoon' || itemType === 'chopsticks') {
                showGrabDropZone(e);
            }
        }
    });
    
    document.addEventListener('dragend', () => {
        hideGrabDropZone();
    });
}

// grab 드롭존에 드롭 처리
function handleGrabDrop(e, action, zone) {
    const source = e.dataTransfer.getData('source');
    let itemType, imageSrc;
    
    if (source === 'dropped') {
        if (!draggedDroppedItem) return;
        itemType = draggedDroppedItem.getAttribute('data-item-type');
        imageSrc = draggedDroppedItem.getAttribute('data-image-src');
    } else if (source === 'slot') {
        if (!draggedElement) return;
        itemType = draggedElement.getAttribute('data-item');
        imageSrc = draggedElement.getAttribute('data-image');
    } else {
        return;
    }
    
    // 숟가락이나 젓가락만 처리
    if (itemType !== 'spoon' && itemType !== 'chopsticks') {
        return;
    }
    
    // 젓가락을 꽂기로 드롭한 경우 정보 메뉴만 표시하고 아이템은 유지
    if (itemType === 'chopsticks' && action === 'stick') {
        showSpeechBubble('그러면 안 돼요!', 3000);
        showChopsticksInfoMenu();
        // 드롭존에서 드래그 오버 클래스 제거
        zone.classList.remove('drag-over');
        document.querySelector('.grab-zone-left')?.classList.remove('drag-over');
        document.querySelector('.grab-zone-right')?.classList.remove('drag-over');
        
        // grab 드롭존 숨기기
        const grabDropZone = document.getElementById('grab-drop-zone');
        if (grabDropZone) {
            grabDropZone.style.display = 'none';
        }
        // 젓가락은 사라지지 않도록 여기서 종료
        return;
    }
    
    // 숟가락을 꽂기로 드롭한 경우도 메시지 표시
    if (itemType === 'spoon' && action === 'stick') {
        showSpeechBubble('그러면 안 돼요!', 3000);
        // 드롭존에서 드래그 오버 클래스 제거
        zone.classList.remove('drag-over');
        document.querySelector('.grab-zone-left')?.classList.remove('drag-over');
        document.querySelector('.grab-zone-right')?.classList.remove('drag-over');
        
        // grab 드롭존 숨기기
        const grabDropZone = document.getElementById('grab-drop-zone');
        if (grabDropZone) {
            grabDropZone.style.display = 'none';
        }
        // 아이템은 사라지지 않도록 여기서 종료
        return;
    }
    
    // 집기 액션 처리
    if (action === 'pick') {
        // 집기로 드롭한 경우 메시지 표시하고 아이템은 유지
        showSpeechBubble('잘 드시니 기분이 좋네요', 3000);
        // 드롭존에서 드래그 오버 클래스 제거
        zone.classList.remove('drag-over');
        document.querySelector('.grab-zone-left')?.classList.remove('drag-over');
        document.querySelector('.grab-zone-right')?.classList.remove('drag-over');
        
        // grab 드롭존 숨기기
        const grabDropZone = document.getElementById('grab-drop-zone');
        if (grabDropZone) {
            grabDropZone.style.display = 'none';
        }
        // 아이템은 사라지지 않도록 여기서 종료
        return;
    }
    
    // 액션에 따른 처리
    console.log(`${itemType}를 ${action === 'stick' ? '꽂기' : '집기'}로 처리`);
    
    // 드롭존에서 드래그 오버 클래스 제거
    zone.classList.remove('drag-over');
    document.querySelector('.grab-zone-left')?.classList.remove('drag-over');
    document.querySelector('.grab-zone-right')?.classList.remove('drag-over');
    
    // 드롭된 아이템인 경우 원래 위치에서 제거
    if (source === 'dropped' && draggedDroppedItem) {
        const originalDropZone = document.getElementById(draggedDroppedItem.getAttribute('data-drop-zone'));
        if (originalDropZone) {
            originalDropZone.classList.remove('filled', 'correct');
            if (placedItems[itemType] === originalDropZone.id) {
                delete placedItems[itemType];
            }
        }
        draggedDroppedItem.remove();
    }
    
    // 슬롯에서 온 경우 슬롯 아이템 숨기기
    if (source === 'slot' && draggedElement) {
        draggedElement.style.display = 'none';
    }
    
    // grab 드롭존 숨기기
    const grabDropZone = document.getElementById('grab-drop-zone');
    if (grabDropZone) {
        grabDropZone.style.display = 'none';
    }
}

// 중국 스테이지용 함수들
function adjustDropZonesToImageSizeChina() {
    // 중국 테이블 이미지 2 크기 조정
    const chinaTableImage2 = document.querySelector('#china-stage .china-table-image img');
    if (chinaTableImage2) {
        const img2 = new Image();
        img2.src = 'cn_table2.png';
        
        const adjustSize2 = function() {
            const naturalWidth = img2.naturalWidth;
            const naturalHeight = img2.naturalHeight;
            
            if (naturalWidth === 0 || naturalHeight === 0) return;
            
            const maxWidth = window.innerWidth * 0.9;
            const maxHeight = window.innerHeight * 0.9;
            
            let width = naturalWidth;
            let height = naturalHeight;
            
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }
            if (height > maxHeight) {
                width = (width * maxHeight) / height;
                height = maxHeight;
            }
            
            chinaTableImage2.style.width = `${width}px`;
            chinaTableImage2.style.height = `${height}px`;
        };
        
        img2.onload = adjustSize2;
        
        if (img2.complete && img2.naturalWidth > 0) {
            adjustSize2();
        }
    }
    
    // 중국 테이블 이미지 1 크기 조정 (원본 크기의 80%)
    const chinaTableImage1 = document.querySelector('#china-stage .china-table-image-1 img');
    if (chinaTableImage1) {
        const img1 = new Image();
        img1.src = 'cn_table1.png';
        
        const adjustSize1 = function() {
            const naturalWidth = img1.naturalWidth;
            const naturalHeight = img1.naturalHeight;
            
            if (naturalWidth === 0 || naturalHeight === 0) return;
            
            // 원본 크기의 80%로 설정
            const width = naturalWidth * 0.8;
            const height = naturalHeight * 0.8;
            
            chinaTableImage1.style.width = `${width}px`;
            chinaTableImage1.style.height = `${height}px`;
        };
        
        img1.onload = adjustSize1;
        
        if (img1.complete && img1.naturalWidth > 0) {
            adjustSize1();
        }
    }
    
    // 중국 식기 이미지들 크기 조정 (원본 크기의 80%)
    const utensilImages = [
        { selector: '.cn-spoon img', src: 'cn_spoon.png' },
        { selector: '.cn-chopstick img', src: 'cn_chopstick.png' },
        { selector: '.cn-rice img', src: 'cn_rice.png' },
        { selector: '.cn-dish img', src: 'cn_dish.png' }
    ];
    
    utensilImages.forEach(({ selector, src }) => {
        const utensilImg = document.querySelector(`#china-stage ${selector}`);
        if (utensilImg) {
            const img = new Image();
            img.src = src;
            
            const adjustSize = function() {
                const naturalWidth = img.naturalWidth;
                const naturalHeight = img.naturalHeight;
                
                if (naturalWidth === 0 || naturalHeight === 0) return;
                
                // 원본 크기의 80%로 설정
                const width = naturalWidth * 0.8;
                const height = naturalHeight * 0.8;
                
                utensilImg.style.width = `${width}px`;
                utensilImg.style.height = `${height}px`;
            };
            
            img.onload = adjustSize;
            
            if (img.complete && img.naturalWidth > 0) {
                adjustSize();
            }
        }
    });
}

// 중국 테이블 이미지 1 드래그 회전 기능
function initializeChinaTable1Rotation() {
    const chinaTable1 = document.querySelector('#china-stage .china-table-image-1');
    const chinaTable1Img = chinaTable1 ? chinaTable1.querySelector('img') : null;
    
    if (!chinaTable1 || !chinaTable1Img) return;
    
    let isDragging = false;
    let startAngle = 0;
    let currentRotation = 0;
    let startX = 0;
    let startY = 0;
    let rotationAtStart = 0; // 드래그 시작 시 회전 각도
    
    // 초기 회전 각도 저장
    const getCurrentRotation = () => {
        const transform = chinaTable1Img.style.transform || '';
        const match = transform.match(/rotate\(([^)]+)\)/);
        if (match) {
            return parseFloat(match[1]) || 0;
        }
        return 0;
    };
    
    // 각도 정규화 함수 (-180 ~ 180 범위로)
    const normalizeAngle = (angle) => {
        while (angle > 180) angle -= 360;
        while (angle < -180) angle += 360;
        return angle;
    };
    
    // 회전 방향 감지 및 처리
    const checkRotationDirection = () => {
        if (!enableTableRotationCheck) return;
        
        const finalRotation = getCurrentRotation();
        const rotationDelta = normalizeAngle(finalRotation - rotationAtStart);
        
        // 반시계방향으로 회전한 경우 (각도가 감소)
        if (rotationDelta < -10) {
            // 반시계방향으로 돌렸을 때는 체크를 계속 유지 (시계방향으로 다시 돌릴 수 있도록)
            const speechText = document.getElementById('speech-text-china');
            // 이미 "오, 그쪽 방향이 아니야" 메시지를 표시했는지 확인
            if (speechText && speechText.textContent !== '오, 그쪽 방향이 아니야') {
                showSpeechBubbleChina('오, 그쪽 방향이 아니야', 3000);
                setTimeout(() => {
                    showTableRotationInfoMenuChina();
                }, 500);
            }
        }
        // 시계방향으로 회전한 경우 (각도가 증가)
        else if (rotationDelta > 10) {
            // 시계방향으로 돌렸을 때는 체크를 계속 유지 (반시계방향으로 다시 돌릴 수 있도록)
            const speechBubble = document.getElementById('speech-bubble-china');
            const speechText = document.getElementById('speech-text-china');
            const nextBtn = document.getElementById('next-speech-btn-china');
            const buttonsContainer = document.getElementById('next-buttons-container-china');
            
            // "오, 고마워" 메시지를 아직 표시하지 않았거나, 다른 메시지가 표시된 경우에만 표시
            if (speechBubble && speechText) {
                const currentText = speechText.textContent;
                // "오, 고마워"가 완전히 표시되지 않은 경우에만 표시 (타이핑 중이거나 다른 메시지인 경우)
                if (currentText !== '오, 고마워') {
                    // 기존 버튼 숨기기
                    if (buttonsContainer) {
                        buttonsContainer.style.display = 'none';
                    }
                    
                    speechText.textContent = '';
                    speechBubble.classList.add('show');
                    
                    // 타이핑 효과로 "오, 고마워" 표시
                    let index = 0;
                    const text = '오, 고마워';
                    if (currentTypingInterval) {
                        clearInterval(currentTypingInterval);
                        currentTypingInterval = null;
                    }
                    
                    currentTypingInterval = setInterval(() => {
                        if (index < text.length) {
                            speechText.textContent += text[index];
                            index++;
                        } else {
                            clearInterval(currentTypingInterval);
                            currentTypingInterval = null;
                            
                            // 타이핑 완료 후 슬라이딩 메뉴 표시 및 버튼 표시
                            setTimeout(() => {
                                showTableRotationInfoMenuChina();
                                
                                // 다음 버튼 표시 (텍스트: "별말씀을")
                                if (nextBtn) {
                                    nextBtn.textContent = '별말씀을';
                                    nextBtn.style.display = 'block';
                                    nextBtn.onclick = () => {
                                        // 다음 대사로 진행
                                        currentSpeechIndexChina++;
                                        if (currentSpeechIndexChina < speechSequenceChina.length) {
                                            showNextSpeechChina();
                                        }
                                    };
                                }
                            }, 500);
                        }
                    }, 30);
                }
            }
        }
    };
    
    // 마우스 이벤트
    chinaTable1.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        rotationAtStart = getCurrentRotation();
        currentRotation = rotationAtStart;
        
        // 이미지 중심점 계산
        const rect = chinaTable1Img.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // 초기 각도 계산
        startAngle = Math.atan2(startY - centerY, startX - centerX) * (180 / Math.PI);
        startAngle -= currentRotation;
        
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        // 이미지 중심점 계산
        const rect = chinaTable1Img.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // 현재 마우스 위치에서 각도 계산
        const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
        
        // 회전 각도 계산 (시계방향/반시계방향)
        const rotation = currentAngle - startAngle;
        currentRotation = rotation;
        
        chinaTable1Img.style.transform = `rotate(${rotation}deg)`;
        
        e.preventDefault();
    });
    
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            checkRotationDirection();
        }
        isDragging = false;
    });
    
    // 터치 이벤트
    chinaTable1.addEventListener('touchstart', (e) => {
        if (e.touches.length !== 1) return;
        isDragging = true;
        const touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        rotationAtStart = getCurrentRotation();
        currentRotation = rotationAtStart;
        
        const rect = chinaTable1Img.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        startAngle = Math.atan2(startY - centerY, startX - centerX) * (180 / Math.PI);
        startAngle -= currentRotation;
        
        e.preventDefault();
    });
    
    document.addEventListener('touchmove', (e) => {
        if (!isDragging || e.touches.length !== 1) return;
        
        const touch = e.touches[0];
        const rect = chinaTable1Img.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const currentAngle = Math.atan2(touch.clientY - centerY, touch.clientX - centerX) * (180 / Math.PI);
        const rotation = currentAngle - startAngle;
        currentRotation = rotation;
        
        chinaTable1Img.style.transform = `rotate(${rotation}deg)`;
        
        e.preventDefault();
    });
    
    document.addEventListener('touchend', () => {
        if (isDragging) {
            checkRotationDirection();
        }
        isDragging = false;
    });
}

function initializeHandDraggingChina() {
    const handElement = document.getElementById('hand-draggable-china');
    if (!handElement) return;
    
    const handImage = handElement.querySelector('img');
    if (!handImage) return;
    
    // 이미지 크기 설정
    const setImageSize = function() {
        const naturalWidth = handImage.naturalWidth;
        const naturalHeight = handImage.naturalHeight;
        const scaledWidth = naturalWidth * 0.8;
        const scaledHeight = naturalHeight * 0.8;
        handImage.style.width = `${scaledWidth}px`;
        handImage.style.height = `${scaledHeight}px`;
    };
    
    handImage.onload = setImageSize;
    if (handImage.complete) {
        setImageSize();
    }
    
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let currentY = 0;
    let rotation = 0;
    
    // 마우스 다운 이벤트
    handElement.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        
        const rect = handElement.getBoundingClientRect();
        currentX = rect.left;
        currentY = rect.top;
        
        handElement.style.transition = 'none';
        e.preventDefault();
    });
    
    // 마우스 이동 이벤트
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        // 위치 업데이트
        const newX = currentX + deltaX;
        const newY = currentY + deltaY;
        handElement.style.left = `${newX}px`;
        handElement.style.top = `${newY}px`;
        handElement.style.bottom = 'auto';
        
        // 회전 각도 계산 (드래그 방향 기준, -45도 ~ 45도 제한)
        let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
        if (angle > 45) angle = 45;
        else if (angle < -45) angle = -45;
        rotation = angle;
        handImage.style.transform = `rotate(${rotation}deg)`;
        
        // 밥그릇 드롭존 위에 있는지 확인
        const riceBowlDropZone = document.getElementById('drop-rice-bowl-china');
        if (riceBowlDropZone) {
            const dropZoneRect = riceBowlDropZone.getBoundingClientRect();
            const handRect = handElement.getBoundingClientRect();
            const handCenterX = handRect.left + handRect.width / 2;
            const handCenterY = handRect.top + handRect.height / 2;
            
            if (handCenterX >= dropZoneRect.left && handCenterX <= dropZoneRect.right &&
                handCenterY >= dropZoneRect.top && handCenterY <= dropZoneRect.bottom) {
                const grabText = document.getElementById('grab-text-china');
                if (grabText) {
                    grabText.style.display = 'block';
                }
            } else {
                const grabText = document.getElementById('grab-text-china');
                if (grabText) {
                    grabText.style.display = 'none';
                }
            }
        }
    });
    
    // 마우스 업 이벤트
    document.addEventListener('mouseup', (e) => {
        if (!isDragging) return;
        isDragging = false;
        
        handElement.style.transition = '';
        
        // 밥그릇 드롭존 위에서 놓았는지 확인
        const riceBowlDropZone = document.getElementById('drop-rice-bowl-china');
        if (riceBowlDropZone) {
            const dropZoneRect = riceBowlDropZone.getBoundingClientRect();
            const handRect = handElement.getBoundingClientRect();
            const handCenterX = handRect.left + handRect.width / 2;
            const handCenterY = handRect.top + handRect.height / 2;
            
            if (handCenterX >= dropZoneRect.left && handCenterX <= dropZoneRect.right &&
                handCenterY >= dropZoneRect.top && handCenterY <= dropZoneRect.bottom) {
                // grab.png로 교체
                replaceWithGrabImageChina();
            }
        }
        
        const grabText = document.getElementById('grab-text-china');
        if (grabText) {
            grabText.style.display = 'none';
        }
    });
    
    // 터치 이벤트
    handElement.addEventListener('touchstart', (e) => {
        if (e.touches.length !== 1) return;
        isDragging = true;
        const touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        
        const rect = handElement.getBoundingClientRect();
        currentX = rect.left;
        currentY = rect.top;
        
        handElement.style.transition = 'none';
        e.preventDefault();
    });
    
    document.addEventListener('touchmove', (e) => {
        if (!isDragging || e.touches.length !== 1) return;
        
        const touch = e.touches[0];
        const deltaX = touch.clientX - startX;
        const deltaY = touch.clientY - startY;
        
        const newX = currentX + deltaX;
        const newY = currentY + deltaY;
        handElement.style.left = `${newX}px`;
        handElement.style.top = `${newY}px`;
        handElement.style.bottom = 'auto';
        
        let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
        if (angle > 45) angle = 45;
        else if (angle < -45) angle = -45;
        rotation = angle;
        handImage.style.transform = `rotate(${rotation}deg)`;
        
        // 밥그릇 드롭존 위에 있는지 확인
        const riceBowlDropZone = document.getElementById('drop-rice-bowl-china');
        if (riceBowlDropZone) {
            const dropZoneRect = riceBowlDropZone.getBoundingClientRect();
            const handRect = handElement.getBoundingClientRect();
            const handCenterX = handRect.left + handRect.width / 2;
            const handCenterY = handRect.top + handRect.height / 2;
            
            if (handCenterX >= dropZoneRect.left && handCenterX <= dropZoneRect.right &&
                handCenterY >= dropZoneRect.top && handCenterY <= dropZoneRect.bottom) {
                const grabText = document.getElementById('grab-text-china');
                if (grabText) {
                    grabText.style.display = 'block';
                }
            } else {
                const grabText = document.getElementById('grab-text-china');
                if (grabText) {
                    grabText.style.display = 'none';
                }
            }
        }
        
        e.preventDefault();
    });
    
    document.addEventListener('touchend', (e) => {
        if (!isDragging) return;
        isDragging = false;
        
        handElement.style.transition = '';
        
        // 밥그릇 드롭존 위에서 놓았는지 확인
        const riceBowlDropZone = document.getElementById('drop-rice-bowl-china');
        if (riceBowlDropZone) {
            const dropZoneRect = riceBowlDropZone.getBoundingClientRect();
            const handRect = handElement.getBoundingClientRect();
            const handCenterX = handRect.left + handRect.width / 2;
            const handCenterY = handRect.top + handRect.height / 2;
            
            if (handCenterX >= dropZoneRect.left && handCenterX <= dropZoneRect.right &&
                handCenterY >= dropZoneRect.top && handCenterY <= dropZoneRect.bottom) {
                replaceWithGrabImageChina();
            }
        }
        
        const grabText = document.getElementById('grab-text-china');
        if (grabText) {
            grabText.style.display = 'none';
        }
    });
}

// 중국 스테이지용 grab 이미지로 교체
function replaceWithGrabImageChina() {
    const handElement = document.getElementById('hand-draggable-china');
    const riceBowlDropZone = document.getElementById('drop-rice-bowl-china');
    
    if (!handElement || !riceBowlDropZone) return;
    
    // 기존 손과 밥그릇 숨기기
    handElement.style.display = 'none';
    
    // 밥그릇 드롭존의 이미지도 숨기기
    const riceBowlImage = riceBowlDropZone.querySelector('.dropped-item');
    if (riceBowlImage) {
        riceBowlImage.style.display = 'none';
    }
    
    // grab.png 이미지 생성
    const grabImage = document.createElement('div');
    grabImage.id = 'grab-image-china';
    grabImage.className = 'grab-image-container';
    
    const img = document.createElement('img');
    img.src = 'grab.png';
    
    img.onload = function() {
        const naturalWidth = this.naturalWidth;
        const naturalHeight = this.naturalHeight;
        const scaledWidth = naturalWidth * 0.9;
        const scaledHeight = naturalHeight * 0.9;
        img.style.width = `${scaledWidth}px`;
        img.style.height = `${scaledHeight}px`;
        
        // 밥그릇 드롭존 위치 기준으로 배치
        const dropZoneRect = riceBowlDropZone.getBoundingClientRect();
        const tableSetting = document.querySelector('#china-stage .table-setting');
        const tableSettingRect = tableSetting ? tableSetting.getBoundingClientRect() : { left: 0, top: 0 };
        
        grabImage.style.position = 'absolute';
        grabImage.style.left = `${dropZoneRect.left - tableSettingRect.left - 140}px`;
        grabImage.style.top = `${dropZoneRect.top - tableSettingRect.top}px`;
        grabImage.style.zIndex = '10';
    };
    
    grabImage.appendChild(img);
    
    const tableSetting = document.querySelector('#china-stage .table-setting');
    if (tableSetting) {
        tableSetting.appendChild(grabImage);
    }
    
    // grab 이미지에 드롭존 설정
    setupGrabDropZoneChina();
}

// 중국 스테이지용 grab 드롭존 설정
function setupGrabDropZoneChina() {
    const grabImage = document.getElementById('grab-image-china');
    if (!grabImage) return;
    
    // 기존 드롭존 제거
    const existingDropZone = document.getElementById('grab-drop-zone-china');
    if (existingDropZone) {
        existingDropZone.remove();
    }
    
    // 새로운 드롭존 생성
    const grabDropZone = document.createElement('div');
    grabDropZone.id = 'grab-drop-zone-china';
    grabDropZone.className = 'grab-drop-zone';
    
    const leftZone = document.createElement('div');
    leftZone.className = 'grab-zone-left';
    leftZone.textContent = '꽂기';
    
    const rightZone = document.createElement('div');
    rightZone.className = 'grab-zone-right';
    rightZone.textContent = '집기';
    
    grabDropZone.appendChild(leftZone);
    grabDropZone.appendChild(rightZone);
    grabImage.appendChild(grabDropZone);
    
    // 드롭존이 숨겨진 상태로 시작
    grabDropZone.style.display = 'none';
    
    // 드래그 이벤트 설정
    const showGrabDropZone = (e) => {
        const itemType = e.target.closest('.slot-item')?.getAttribute('data-item');
        const droppedItem = e.target.closest('.dropped-item');
        const droppedItemType = droppedItem?.getAttribute('data-item-type');
        
        if (itemType === 'spoon' || itemType === 'chopsticks' || 
            droppedItemType === 'spoon' || droppedItemType === 'chopsticks') {
            grabDropZone.style.display = 'flex';
        }
    };
    
    const hideGrabDropZone = () => {
        grabDropZone.style.display = 'none';
        leftZone.classList.remove('drag-over');
        rightZone.classList.remove('drag-over');
    };
    
    // 슬롯 아이템 드래그 이벤트
    const spoonItem = document.querySelector('#china-stage .slot-item[data-item="spoon"]');
    const chopsticksItem = document.querySelector('#china-stage .slot-item[data-item="chopsticks"]');
    
    [spoonItem, chopsticksItem].forEach(item => {
        if (item) {
            item.addEventListener('dragstart', showGrabDropZone);
            item.addEventListener('dragend', hideGrabDropZone);
        }
    });
    
    // grab 드롭존에 드래그 오버 이벤트
    grabDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const rect = grabDropZone.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const isLeft = x < rect.width / 2;
        
        if (isLeft) {
            leftZone.classList.add('drag-over');
            rightZone.classList.remove('drag-over');
        } else {
            rightZone.classList.add('drag-over');
            leftZone.classList.remove('drag-over');
        }
    });
    
    grabDropZone.addEventListener('dragleave', (e) => {
        if (!grabDropZone.contains(e.relatedTarget)) {
            leftZone.classList.remove('drag-over');
            rightZone.classList.remove('drag-over');
        }
    });
    
    leftZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleGrabDropChina(e, 'stick', leftZone);
    });
    
    rightZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleGrabDropChina(e, 'pick', rightZone);
    });
    
    // 전역 드래그 이벤트로 드롭된 아이템 감지
    document.addEventListener('dragstart', (e) => {
        const droppedItem = e.target.closest('#china-stage .dropped-item');
        if (droppedItem) {
            const itemType = droppedItem.getAttribute('data-item-type');
            if (itemType === 'spoon' || itemType === 'chopsticks') {
                showGrabDropZone(e);
            }
        }
    });
    
    document.addEventListener('dragend', () => {
        hideGrabDropZone();
    });
}

// 중국 스테이지용 grab 드롭 처리
function handleGrabDropChina(e, action, zone) {
    const source = e.dataTransfer.getData('source');
    let itemType, imageSrc;
    
    if (source === 'dropped') {
        if (!draggedDroppedItem) return;
        itemType = draggedDroppedItem.getAttribute('data-item-type');
        imageSrc = draggedDroppedItem.getAttribute('data-image-src');
    } else if (source === 'slot') {
        if (!draggedElement) return;
        itemType = draggedElement.getAttribute('data-item');
        imageSrc = draggedElement.getAttribute('data-image');
    } else {
        return;
    }
    
    // 숟가락이나 젓가락만 처리
    if (itemType !== 'spoon' && itemType !== 'chopsticks') {
        return;
    }
    
    // 젓가락을 꽂기로 드롭한 경우 정보 메뉴만 표시하고 아이템은 유지
    if (itemType === 'chopsticks' && action === 'stick') {
        showSpeechBubbleChina('그러면 안 돼요!', 3000);
        showChopsticksInfoMenuChina();
        zone.classList.remove('drag-over');
        document.querySelector('#grab-drop-zone-china .grab-zone-left')?.classList.remove('drag-over');
        document.querySelector('#grab-drop-zone-china .grab-zone-right')?.classList.remove('drag-over');
        
        const grabDropZone = document.getElementById('grab-drop-zone-china');
        if (grabDropZone) {
            grabDropZone.style.display = 'none';
        }
        return;
    }
    
    // 숟가락을 꽂기로 드롭한 경우도 메시지 표시
    if (itemType === 'spoon' && action === 'stick') {
        showSpeechBubbleChina('그러면 안 돼요!', 3000);
        zone.classList.remove('drag-over');
        document.querySelector('#grab-drop-zone-china .grab-zone-left')?.classList.remove('drag-over');
        document.querySelector('#grab-drop-zone-china .grab-zone-right')?.classList.remove('drag-over');
        
        const grabDropZone = document.getElementById('grab-drop-zone-china');
        if (grabDropZone) {
            grabDropZone.style.display = 'none';
        }
        return;
    }
    
    // 집기 액션 처리
    if (action === 'pick') {
        // 집기로 드롭한 경우 메시지 표시하고 아이템은 유지
        showSpeechBubbleChina('잘 드시니 기분이 좋네요', 3000);
        // 드롭존에서 드래그 오버 클래스 제거
        zone.classList.remove('drag-over');
        document.querySelector('#grab-drop-zone-china .grab-zone-left')?.classList.remove('drag-over');
        document.querySelector('#grab-drop-zone-china .grab-zone-right')?.classList.remove('drag-over');
        
        // grab 드롭존 숨기기
        const grabDropZone = document.getElementById('grab-drop-zone-china');
        if (grabDropZone) {
            grabDropZone.style.display = 'none';
        }
        // 아이템은 사라지지 않도록 여기서 종료
        return;
    }
    
    // 드롭존에서 드래그 오버 클래스 제거
    zone.classList.remove('drag-over');
    document.querySelector('#grab-drop-zone-china .grab-zone-left')?.classList.remove('drag-over');
    document.querySelector('#grab-drop-zone-china .grab-zone-right')?.classList.remove('drag-over');
    
    // 드롭된 아이템인 경우 원래 위치에서 제거
    if (source === 'dropped' && draggedDroppedItem) {
        const originalDropZone = document.getElementById(draggedDroppedItem.getAttribute('data-drop-zone'));
        if (originalDropZone) {
            originalDropZone.classList.remove('filled', 'correct');
            if (placedItems[itemType] === originalDropZone.id) {
                delete placedItems[itemType];
            }
        }
        draggedDroppedItem.remove();
    }
    
    // 슬롯에서 온 경우 슬롯 아이템 숨기기
    if (source === 'slot' && draggedElement) {
        draggedElement.style.display = 'none';
    }
    
    // grab 드롭존 숨기기
    const grabDropZone = document.getElementById('grab-drop-zone-china');
    if (grabDropZone) {
        grabDropZone.style.display = 'none';
    }
}

function setupRiceBowlDropZoneChina() {
    const riceBowlDropZone = document.getElementById('rice-bowl-drop-zone-china');
    if (!riceBowlDropZone) return;
    
    const leftZone = riceBowlDropZone.querySelector('.rice-bowl-zone-left');
    const rightZone = riceBowlDropZone.querySelector('.rice-bowl-zone-right');
    
    // 드래그 오버 이벤트 (드롭존이 표시되어 있을 때만 작동)
    riceBowlDropZone.addEventListener('dragover', (e) => {
        // 드롭존이 숨겨져 있으면 이벤트 처리 안 함
        if (riceBowlDropZone.style.display === 'none') {
            return;
        }
        
        e.preventDefault();
        e.stopPropagation();
        const rect = riceBowlDropZone.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const isLeft = x < rect.width / 2;
        if (isLeft) {
            leftZone.classList.add('drag-over');
            rightZone.classList.remove('drag-over');
        } else {
            rightZone.classList.add('drag-over');
            leftZone.classList.remove('drag-over');
        }
    });
    
    riceBowlDropZone.addEventListener('dragleave', (e) => {
        if (!riceBowlDropZone.contains(e.relatedTarget)) {
            leftZone.classList.remove('drag-over');
            rightZone.classList.remove('drag-over');
        }
    });
    
    leftZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleRiceBowlDropChina(e, 'stick', leftZone);
    });
    
    rightZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleRiceBowlDropChina(e, 'pick', rightZone);
    });
}

function handleRiceBowlDropChina(e, action, zone) {
    const source = e.dataTransfer.getData('source');
    let itemType;
    
    if (source === 'dropped') {
        if (!draggedDroppedItem) return;
        itemType = draggedDroppedItem.getAttribute('data-item-type');
    } else if (source === 'slot') {
        if (!draggedElement) return;
        itemType = draggedElement.getAttribute('data-item');
    } else {
        return;
    }
    
    if (itemType !== 'spoon' && itemType !== 'chopsticks') {
        return;
    }
    
    // 꽂기로 드롭한 경우 메시지 표시
    if (action === 'stick') {
        showSpeechBubbleChina('그러면 안 돼요!', 3000);
        if (itemType === 'chopsticks') {
            showChopsticksInfoMenuChina();
        } else {
            showUtensilHoldingInfoMenuChina();
        }
    } else if (action === 'pick') {
        // 집기로 드롭한 경우 메시지 표시하고 아이템은 유지
        showSpeechBubbleChina('잘 드시니 기분이 좋네요', 3000);
        // 아이템은 사라지지 않도록 여기서 종료
        zone.classList.remove('drag-over');
        document.querySelectorAll('#rice-bowl-drop-zone-china .rice-bowl-zone-left, #rice-bowl-drop-zone-china .rice-bowl-zone-right').forEach(z => {
            z.classList.remove('drag-over');
        });
        
        // 밥그릇 드롭존 숨기기
        const riceBowlDropZone = document.getElementById('rice-bowl-drop-zone-china');
        if (riceBowlDropZone) {
            riceBowlDropZone.style.display = 'none';
        }
        return;
    }
    
    zone.classList.remove('drag-over');
    document.querySelectorAll('#rice-bowl-drop-zone-china .rice-bowl-zone-left, #rice-bowl-drop-zone-china .rice-bowl-zone-right').forEach(z => {
        z.classList.remove('drag-over');
    });
    
    const riceBowlDropZone = document.getElementById('rice-bowl-drop-zone-china');
    if (riceBowlDropZone) {
        riceBowlDropZone.style.display = 'none';
    }
}

function showRiceBowlFromCheftableChina() {
    const tableSetting = document.querySelector('#china-stage .table-setting');
    const topCheftable = document.querySelector('#china-stage .top-cheftable');
    if (!tableSetting || !topCheftable) return;
    
    const cheftableRiceBowl = document.createElement('div');
    cheftableRiceBowl.className = 'cheftable-rice-bowl';
    cheftableRiceBowl.draggable = true;
    cheftableRiceBowl.setAttribute('data-item', 'rice-bowl');
    cheftableRiceBowl.setAttribute('data-image', 'dish.png');
    
    const img = document.createElement('img');
    img.src = 'dish.png';
    
    img.onload = function() {
        const naturalWidth = this.naturalWidth;
        const naturalHeight = this.naturalHeight;
        this.style.width = `${naturalWidth * 0.8}px`;
        this.style.height = `${naturalHeight * 0.8}px`;
    };
    
    cheftableRiceBowl.appendChild(img);
    tableSetting.appendChild(cheftableRiceBowl);
    
    setTimeout(() => {
        const cheftableRect = topCheftable.getBoundingClientRect();
        const tableSettingRect = tableSetting.getBoundingClientRect();
        const finalRect = document.getElementById('drop-rice-bowl-china')?.getBoundingClientRect();
        
        if (finalRect) {
            const startTop = cheftableRect.bottom - tableSettingRect.top;
            const endTop = finalRect.top - tableSettingRect.top;
            
            cheftableRiceBowl.style.left = `${finalRect.left - tableSettingRect.left + finalRect.width / 2}px`;
            cheftableRiceBowl.style.top = `${startTop}px`;
            cheftableRiceBowl.style.transform = 'translate(-50%, 0)';
            cheftableRiceBowl.style.transition = 'top 1s ease-out';
            
            requestAnimationFrame(() => {
                cheftableRiceBowl.style.top = `${endTop}px`;
            });
        }
    }, 100);
}

// 페이지 로드 시 드롭 존 크기 초기화 (스테이지가 처음 열릴 때를 대비)
window.addEventListener('load', () => {
    // 스테이지가 이미 활성화되어 있다면 드롭 존 크기 조정
    if (document.getElementById('japan-stage')?.classList.contains('active')) {
        adjustDropZonesToImageSize();
    }
    if (document.getElementById('china-stage')?.classList.contains('active')) {
        adjustDropZonesToImageSizeChina();
    }
    // 손 이미지 드래그 기능 초기화
    initializeHandDragging();
});

// 말풍선 타이핑 효과를 위한 전역 변수
let currentTypingInterval = null;
let speechMessages = [];
let currentSpeechIndex = 0;
let onNextCallback = null;

// 중국 스테이지용 변수
let currentSpeechIndexChina = 0;
let enableTableRotationCheck = false; // 테이블 회전 체크 활성화 여부

// 중국 스테이지 다음 대사 표시
function showNextSpeechChina() {
    if (currentSpeechIndexChina < speechSequenceChina.length) {
        const isLast = currentSpeechIndexChina === speechSequenceChina.length - 1;
        const currentSpeech = speechSequenceChina[currentSpeechIndexChina];
        const currentText = typeof currentSpeech === 'string' ? currentSpeech : currentSpeech.text;
        const buttonText = typeof currentSpeech === 'string' ? BUTTON_TEXTS.nextChina : (currentSpeech.buttonText || BUTTON_TEXTS.nextChina);
        const buttons = typeof currentSpeech === 'string' ? null : (currentSpeech.buttons || null);
        
        // 다음 대사로 넘어가는 콜백
        const nextCallback = () => {
            currentSpeechIndexChina++;
            
            if (currentSpeechIndexChina < speechSequenceChina.length) {
                showNextSpeechChina();
            }
        };
        
        showSpeechBubbleChina(currentText, 0, !isLast, nextCallback, null, buttonText, buttons);
    }
}

// 중국 스테이지 말풍선 표시
function showSpeechBubbleChina(text, duration = 3000, showNextButton = false, nextCallback = null, onStartCallback = null, buttonText = null, buttons = null) {
    const speechBubble = document.getElementById('speech-bubble-china');
    const speechText = document.getElementById('speech-text-china');
    const nextBtn = document.getElementById('next-speech-btn-china');
    const buttonsContainer = document.getElementById('next-buttons-container-china');
    
    if (!speechBubble || !speechText) return;
    
    if (onStartCallback) {
        onStartCallback();
    }
    
    onNextCallback = nextCallback;
    
    speechText.textContent = '';
    speechBubble.classList.add('show');
    
    // 여러 버튼이 있는 경우
    if (buttons && Array.isArray(buttons) && buttons.length > 0) {
        // 기존 단일 버튼 숨기기
        if (nextBtn) {
            nextBtn.style.display = 'none';
        }
        
        // 버튼 컨테이너에 버튼 생성 (타이핑 완료 후 표시됨)
        if (buttonsContainer) {
            buttonsContainer.innerHTML = ''; // 기존 버튼 제거
            buttonsContainer.style.display = 'none'; // 타이핑 완료 전까지 숨김
            
            buttons.forEach((btn, index) => {
                const button = document.createElement('button');
                button.className = 'next-btn';
                button.textContent = btn.text;
                button.onclick = () => {
                    if (btn.callback) {
                        btn.callback();
                    }
                    if (nextCallback) {
                        nextCallback();
                    }
                };
                buttonsContainer.appendChild(button);
            });
        }
    } else {
        // 단일 버튼 사용
        if (buttonsContainer) {
            buttonsContainer.style.display = 'none';
            buttonsContainer.innerHTML = '';
        }
        
        // 다음 버튼 숨기기 (타이핑 중에는 숨김)
        if (nextBtn) {
            // 버튼 텍스트 설정 (지정된 텍스트가 있으면 사용, 없으면 기본값)
            if (buttonText) {
                nextBtn.textContent = buttonText;
            } else {
                nextBtn.textContent = BUTTON_TEXTS.nextChina;
            }
            nextBtn.style.display = 'none';
        }
    }
    
    let index = 0;
    if (currentTypingInterval) {
        clearInterval(currentTypingInterval);
        currentTypingInterval = null;
    }
    
    currentTypingInterval = setInterval(() => {
        if (index < text.length) {
            speechText.textContent += text[index];
            index++;
        } else {
            clearInterval(currentTypingInterval);
            currentTypingInterval = null;
            
            // 타이핑 완료 후 여러 버튼이 있으면 표시
            if (buttons && Array.isArray(buttons) && buttons.length > 0) {
                if (buttonsContainer) {
                    buttonsContainer.style.display = 'flex';
                }
            }
            
            // 타이핑 완료 후 다음 버튼 표시
            if (showNextButton && nextBtn && !buttons) {
                nextBtn.style.display = 'block';
                nextBtn.onclick = () => {
                    if (onNextCallback) {
                        onNextCallback();
                    }
                };
            }
            
            // 지정된 시간 후 자동으로 사라짐 (버튼이 없을 때만)
            if (duration > 0 && !showNextButton && !buttons) {
                setTimeout(() => {
                    speechBubble.classList.remove('show');
                    if (nextCallback) nextCallback();
                }, duration);
            }
        }
    }, 30);
}

// 중국 스테이지 정보 메뉴 함수들
function showChopsticksInfoMenuChina() {
    const infoMenu = document.getElementById('chopsticks-info-menu-china');
    if (!infoMenu) return;
    infoMenu.style.display = 'block';
    infoMenu.style.right = '-400px';
    setTimeout(() => {
        infoMenu.style.transition = 'right 0.5s ease-out';
        infoMenu.style.right = '0';
    }, 50);
}

function closeChopsticksInfoMenuChina() {
    const infoMenu = document.getElementById('chopsticks-info-menu-china');
    if (!infoMenu) return;
    infoMenu.style.transition = 'right 0.5s ease-in';
    infoMenu.style.right = '-400px';
    setTimeout(() => {
        infoMenu.style.display = 'none';
    }, 500);
}

function showUtensilHoldingInfoMenuChina() {
    const infoMenu = document.getElementById('utensil-holding-info-menu-china');
    if (!infoMenu) return;
    infoMenu.style.display = 'block';
    infoMenu.style.right = '-400px';
    setTimeout(() => {
        infoMenu.style.transition = 'right 0.5s ease-out';
        infoMenu.style.right = '0';
    }, 50);
}

function closeUtensilHoldingInfoMenuChina() {
    const infoMenu = document.getElementById('utensil-holding-info-menu-china');
    if (!infoMenu) return;
    infoMenu.style.transition = 'right 0.5s ease-in';
    infoMenu.style.right = '-400px';
    setTimeout(() => {
        infoMenu.style.display = 'none';
    }, 500);
}

// 중국 스테이지 음식 주문 예절 정보 메뉴 표시
function showFoodOrderInfoMenuChina() {
    const infoMenu = document.getElementById('food-order-info-menu-china');
    if (!infoMenu) return;
    infoMenu.style.display = 'block';
    infoMenu.style.right = '-400px';
    setTimeout(() => {
        infoMenu.style.transition = 'right 0.5s ease-out';
        infoMenu.style.right = '0';
    }, 50);
}

// 중국 스테이지 음식 주문 예절 정보 메뉴 닫기
function closeFoodOrderInfoMenuChina() {
    const infoMenu = document.getElementById('food-order-info-menu-china');
    if (!infoMenu) return;
    infoMenu.style.transition = 'right 0.5s ease-in';
    infoMenu.style.right = '-400px';
    setTimeout(() => {
        infoMenu.style.display = 'none';
    }, 500);
}

// 중국 스테이지 테이블 회전 예절 정보 메뉴 표시
function showTableRotationInfoMenuChina() {
    const infoMenu = document.getElementById('table-rotation-info-menu-china');
    if (!infoMenu) return;
    infoMenu.style.display = 'block';
    infoMenu.style.right = '-400px';
    setTimeout(() => {
        infoMenu.style.transition = 'right 0.5s ease-out';
        infoMenu.style.right = '0';
    }, 50);
}

// 중국 스테이지 테이블 회전 예절 정보 메뉴 닫기
function closeTableRotationInfoMenuChina() {
    const infoMenu = document.getElementById('table-rotation-info-menu-china');
    if (!infoMenu) return;
    infoMenu.style.transition = 'right 0.5s ease-in';
    infoMenu.style.right = '-400px';
    setTimeout(() => {
        infoMenu.style.display = 'none';
    }, 500);
}

// 대사 배열 (대사와 버튼 텍스트를 함께 관리)
const speechSequence = [
    { text: 'いらっしゃいませ。자리에 앉아주세요.', buttonText: '다음' },
    { text: '주문하신 규동 드리겠습니다. 부디 편하게 즐겨주세요', buttonText: '감사합니다' },
];

// 중국 스테이지 대사 배열 (대사와 버튼 텍스트를 함께 관리)
const speechSequenceChina = [
    { text: '你好! 오늘은 내가 대접하는 날이네', buttonText: '다음' },
    { text: '편하게 먹고싶은거 다 시켜', buttonText: '고마워' },
    { 
        text: '메뉴는 몇 개 시키면 될까까?', 
        buttons: [
            { 
                text: '3개면 될 것 같은데', 
                callback: () => {
                    // 버튼은 그대로 유지하고, "뭐라고" 텍스트를 타이핑 효과로 표시
                    const speechBubble = document.getElementById('speech-bubble-china');
                    const speechText = document.getElementById('speech-text-china');
                    if (speechBubble && speechText) {
                        speechText.textContent = '';
                        speechBubble.classList.add('show');
                        
                        // 타이핑 효과로 "뭐라고" 표시
                        let index = 0;
                        const text = '뭐라고?';
                        if (currentTypingInterval) {
                            clearInterval(currentTypingInterval);
                            currentTypingInterval = null;
                        }
                        
                        currentTypingInterval = setInterval(() => {
                            if (index < text.length) {
                                speechText.textContent += text[index];
                                index++;
                            } else {
                                clearInterval(currentTypingInterval);
                                currentTypingInterval = null;
                                
                                // 타이핑 완료 후 슬라이딩 메뉴 표시
                                setTimeout(() => {
                                    showFoodOrderInfoMenuChina();
                                }, 500);
                            }
                        }, 30);
                    }
                }
            },
            { 
                text: '4개로 하자', 
                callback: () => {
                    // 버튼은 그대로 유지하고, "응 4개면 충분하겠지" 텍스트를 타이핑 효과로 표시
                    const speechBubble = document.getElementById('speech-bubble-china');
                    const speechText = document.getElementById('speech-text-china');
                    const nextBtn = document.getElementById('next-speech-btn-china');
                    const buttonsContainer = document.getElementById('next-buttons-container-china');
                    
                    if (speechBubble && speechText) {
                        // 기존 버튼 컨테이너 숨기기
                        if (buttonsContainer) {
                            buttonsContainer.style.display = 'none';
                        }
                        
                        speechText.textContent = '';
                        speechBubble.classList.add('show');
                        
                        // 타이핑 효과로 "응 4개면 충분하겠지" 표시
                        let index = 0;
                        const text = '응 4개면 충분하겠지';
                        if (currentTypingInterval) {
                            clearInterval(currentTypingInterval);
                            currentTypingInterval = null;
                        }
                        
                        currentTypingInterval = setInterval(() => {
                            if (index < text.length) {
                                speechText.textContent += text[index];
                                index++;
                            } else {
                                clearInterval(currentTypingInterval);
                                currentTypingInterval = null;
                                
                                // 타이핑 완료 후 슬라이딩 메뉴 표시
                                setTimeout(() => {
                                    showFoodOrderInfoMenuChina();
                                    
                                    // 다음 버튼 표시 (텍스트: "그래")
                                    if (nextBtn) {
                                        nextBtn.textContent = '뭐 필요한거 있어?';
                                        nextBtn.style.display = 'block';
                                        nextBtn.onclick = () => {
                                            // "테이블 돌려서 저 마라탕좀 먹을 수 있게 해 줄래?" 텍스트 표시
                                            const speechBubble = document.getElementById('speech-bubble-china');
                                            const speechText = document.getElementById('speech-text-china');
                                            const buttonsContainer = document.getElementById('next-buttons-container-china');
                                            
                                            if (speechBubble && speechText) {
                                                // 기존 버튼 숨기기
                                                if (nextBtn) {
                                                    nextBtn.style.display = 'none';
                                                }
                                                if (buttonsContainer) {
                                                    buttonsContainer.style.display = 'none';
                                                }
                                                
                                                speechText.textContent = '';
                                                speechBubble.classList.add('show');
                                                
                                                // 타이핑 효과로 텍스트 표시
                                                let index = 0;
                                                const text = '테이블 돌려서 저 마라탕좀 먹을 수 있게 해 줄래?';
                                                if (currentTypingInterval) {
                                                    clearInterval(currentTypingInterval);
                                                    currentTypingInterval = null;
                                                }
                                                
                                                currentTypingInterval = setInterval(() => {
                                                    if (index < text.length) {
                                                        speechText.textContent += text[index];
                                                        index++;
                                                    } else {
                                                        clearInterval(currentTypingInterval);
                                                        currentTypingInterval = null;
                                                        
                                                        // 테이블 회전 대기 상태 활성화
                                                        enableTableRotationCheck = true;
                                                    }
                                                }, 30);
                                            }
                                        };
                                    }
                                }, 500);
                            }
                        }, 30);
                    }
                }
            }
        ]
    },
];

// 다음 대사 표시
function showNextSpeech() {
    if (currentSpeechIndex < speechSequence.length) {
        const isLast = currentSpeechIndex === speechSequence.length - 1;
        const currentSpeech = speechSequence[currentSpeechIndex];
        const currentText = typeof currentSpeech === 'string' ? currentSpeech : currentSpeech.text;
        const buttonText = typeof currentSpeech === 'string' ? BUTTON_TEXTS.nextJapan : (currentSpeech.buttonText || BUTTON_TEXTS.nextJapan);
        
        // "주문하신 정어리 정식..." 대사인 경우 타이핑 시작 시 밥그릇 표시
        const onStartCallback = currentText.includes('주문하신 정어리 정식') || currentText.includes('주문하신 규동') ? () => {
            showRiceBowlFromCheftable();
        } : null;
        
        showSpeechBubble(currentText, 0, !isLast, () => {
            currentSpeechIndex++;
            
            if (currentSpeechIndex < speechSequence.length) {
                showNextSpeech();
            }
        }, onStartCallback, buttonText);
    }
}

// 손가락 가이드 애니메이션 함수
function startFingerGuideAnimation(riceBowl) {
    const tableSetting = document.querySelector('.table-setting');
    const dropZone = document.getElementById('drop-rice-bowl');
    
    if (!tableSetting || !riceBowl || !dropZone) return;
    
    // 기존 가이드 제거
    const existingGuide = document.getElementById('finger-guide');
    if (existingGuide) {
        existingGuide.remove();
    }
    
    // 손가락 가이드 요소 생성
    const fingerGuide = document.createElement('div');
    fingerGuide.id = 'finger-guide';
    fingerGuide.className = 'finger-guide';
    
    const fingerImg = document.createElement('img');
    fingerImg.src = 'finger.png';
    fingerImg.alt = '손가락 가이드';
    fingerGuide.appendChild(fingerImg);
    
    tableSetting.appendChild(fingerGuide);
    
    // 위치 계산
    const riceBowlRect = riceBowl.getBoundingClientRect();
    const dropZoneRect = dropZone.getBoundingClientRect();
    const tableSettingRect = tableSetting.getBoundingClientRect();
    
    const startX = riceBowlRect.left + riceBowlRect.width / 2 - tableSettingRect.left;
    const startY = riceBowlRect.bottom - tableSettingRect.top - 20; // 밥그릇 아래쪽에서 시작 (20px 여유)
    const endX = dropZoneRect.left + dropZoneRect.width / 2 - tableSettingRect.left;
    const endY = dropZoneRect.top + dropZoneRect.height / 2 - tableSettingRect.top;
    
    // 손가락 이미지 크기 설정
    fingerImg.onload = function() {
        const naturalWidth = this.naturalWidth;
        const naturalHeight = this.naturalHeight;
        const scale = 0.15; // 손가락 가이드는 작게 (반으로 줄임)
        this.style.width = `${naturalWidth * scale}px`;
        this.style.height = `${naturalHeight * scale}px`;
    };
    
    // 초기 위치 설정
    fingerGuide.style.position = 'absolute';
    fingerGuide.style.left = `${startX}px`;
    fingerGuide.style.top = `${startY}px`;
    fingerGuide.style.transform = 'translate(-50%, -50%)';
    fingerGuide.style.zIndex = '1000';
    fingerGuide.style.pointerEvents = 'none';
    
    // 애니메이션 시작
    let animationCount = 0;
    const maxAnimations = 3; // 3번 반복
    
    const animate = () => {
        if (animationCount >= maxAnimations) {
            fingerGuide.remove();
            return;
        }
        
        // 드롭존으로 이동
        fingerGuide.style.transition = 'left 1s ease-in-out, top 1s ease-in-out';
        fingerGuide.style.left = `${endX}px`;
        fingerGuide.style.top = `${endY}px`;
        
        // 드롭존에서 잠시 대기 후 다시 밥그릇으로
        setTimeout(() => {
            fingerGuide.style.transition = 'left 0.5s ease-in-out, top 0.5s ease-in-out';
            fingerGuide.style.left = `${startX}px`;
            fingerGuide.style.top = `${startY}px`;
            
            setTimeout(() => {
                animationCount++;
                if (animationCount < maxAnimations) {
                    animate();
                } else {
                    fingerGuide.remove();
                }
            }, 500);
        }, 1000);
    };
    
    // 첫 애니메이션 시작
    setTimeout(() => {
        animate();
    }, 300);
}

// 밥그릇이 셰프테이블에서 아래로 내려오는 함수
function showRiceBowlFromCheftable() {
    const tableSetting = document.querySelector('.table-setting');
    const topCheftable = document.querySelector('.top-cheftable');
    
    if (!tableSetting || !topCheftable) {
        console.log('tableSetting or topCheftable not found');
        return;
    }
    
    // 이미 밥그릇이 있으면 리턴
    if (document.querySelector('.cheftable-rice-bowl')) {
        console.log('rice bowl already exists');
        return;
    }
    
    // 밥그릇 이미지 생성
    const riceBowl = document.createElement('div');
    riceBowl.className = 'cheftable-rice-bowl';
    riceBowl.draggable = true;
    riceBowl.setAttribute('data-item', 'rice-bowl');
    riceBowl.setAttribute('data-image', 'dish.png');
    
    const img = document.createElement('img');
    img.src = 'dish.png';
    img.style.display = 'block';
    
    // 이미지가 로드된 후 위치 설정 및 애니메이션 시작
    const setupPositionAndAnimate = () => {
        // 셰프테이블 위치 확인 (중앙 계산용)
        const cheftableRect = topCheftable.getBoundingClientRect();
        const tableSettingRect = tableSetting.getBoundingClientRect();
        
        // 이미지 크기 설정
        const naturalWidth = img.naturalWidth;
        const naturalHeight = img.naturalHeight;
        const scaledWidth = naturalWidth * 0.8;
        const scaledHeight = naturalHeight * 0.8;
        img.style.width = `${scaledWidth}px`;
        img.style.height = `${scaledHeight}px`;
        
        // 초기 위치 (화면 상단 기준 15%)
        const startTopPercent = -30; // 화면 상단에서 15%
        const startTop = (window.innerHeight * startTopPercent / 100) - tableSettingRect.top;
        const centerLeft = cheftableRect.left - tableSettingRect.left + cheftableRect.width / 2 + 300; // 오른쪽으로 100px 이동
        
        // 최종 위치 (화면 상단 기준 40%)
        const endTopPercent = -15; // 화면 상단에서 40%
        const endTop = (window.innerHeight * endTopPercent / 100) - tableSettingRect.top;
        
        riceBowl.style.position = 'absolute';
        riceBowl.style.left = `${centerLeft}px`;
        riceBowl.style.top = `${startTop}px`;
        riceBowl.style.transform = 'translate(-50%, 0)';
        riceBowl.style.opacity = '0';
        riceBowl.style.transition = 'opacity 0.5s ease-in, top 1s ease-out';
        riceBowl.style.zIndex = '10';
        riceBowl.style.cursor = 'grab';
        
        // 나타나는 애니메이션 (아래로 내려오기)
        setTimeout(() => {
            riceBowl.style.opacity = '1';
            riceBowl.style.top = `${endTop}px`;
        }, 50);
    };
    
    img.onload = setupPositionAndAnimate;
    
    if (img.complete) {
        setupPositionAndAnimate();
    }
    
    riceBowl.appendChild(img);
    tableSetting.appendChild(riceBowl);
    
    // 드래그 이벤트 추가
    riceBowl.addEventListener('dragstart', handleDragStart);
    riceBowl.addEventListener('dragend', handleDragEnd);
    
    // 밥그릇이 등장한 후 손가락 가이드 애니메이션 시작 (0.5초 후 시작)
    setTimeout(() => {
        startFingerGuideAnimation(riceBowl);
    }, 500); // 밥그릇이 나타난 후 0.5초 뒤 시작
}

// 말풍선 표시 함수
function showSpeechBubble(text, duration = 3000, showNextButton = false, nextCallback = null, onStartCallback = null, buttonText = null, buttons = null) {
    const speechBubble = document.getElementById('speech-bubble');
    const speechText = document.getElementById('speech-text');
    const nextBtn = document.getElementById('next-speech-btn');
    const buttonsContainer = document.getElementById('next-buttons-container');
    
    if (!speechBubble || !speechText) return;
    
    // 이전 타이핑 효과가 있으면 정리
    if (currentTypingInterval) {
        clearInterval(currentTypingInterval);
        currentTypingInterval = null;
    }
    
    // 다음 버튼 콜백 저장
    onNextCallback = nextCallback;
    
    // 텍스트 설정
    speechText.textContent = '';
    speechBubble.classList.add('show');
    
    // 여러 버튼이 있는 경우
    if (buttons && Array.isArray(buttons) && buttons.length > 0) {
        // 기존 단일 버튼 숨기기
        if (nextBtn) {
            nextBtn.style.display = 'none';
        }
        
        // 버튼 컨테이너에 버튼 생성 (타이핑 완료 후 표시됨)
        if (buttonsContainer) {
            buttonsContainer.innerHTML = ''; // 기존 버튼 제거
            buttonsContainer.style.display = 'none'; // 타이핑 완료 전까지 숨김
            
            buttons.forEach((btn, index) => {
                const button = document.createElement('button');
                button.className = 'next-btn';
                button.textContent = btn.text;
                button.onclick = () => {
                    if (btn.callback) {
                        btn.callback();
                    }
                    if (nextCallback) {
                        nextCallback();
                    }
                };
                buttonsContainer.appendChild(button);
            });
        }
    } else {
        // 단일 버튼 사용
        if (buttonsContainer) {
            buttonsContainer.style.display = 'none';
            buttonsContainer.innerHTML = '';
        }
        
        // 다음 버튼 숨기기 (타이핑 중에는 숨김)
        if (nextBtn) {
            // 버튼 텍스트 설정 (지정된 텍스트가 있으면 사용, 없으면 기본값)
            if (buttonText) {
                nextBtn.textContent = buttonText;
            } else {
                nextBtn.textContent = BUTTON_TEXTS.nextJapan;
            }
            nextBtn.style.display = 'none';
        }
    }
    
    // 타이핑 시작 시 콜백 호출 (밥그릇 표시 등)
    if (onStartCallback) {
        onStartCallback();
    }
    
    // 타이핑 효과로 텍스트 표시
    let index = 0;
    currentTypingInterval = setInterval(() => {
        if (index < text.length) {
            speechText.textContent += text[index];
            index++;
        } else {
            clearInterval(currentTypingInterval);
            currentTypingInterval = null;
            
            // 타이핑 완료 후 여러 버튼이 있으면 표시
            if (buttons && Array.isArray(buttons) && buttons.length > 0) {
                if (buttonsContainer) {
                    buttonsContainer.style.display = 'flex';
                }
            }
            
            // 타이핑 완료 후 다음 버튼 표시
            if (showNextButton && nextBtn && !buttons) {
                nextBtn.style.display = 'block';
            }
            
            // 지정된 시간 후 자동으로 사라짐 (버튼이 없을 때만)
            if (duration > 0 && !showNextButton && !buttons) {
                setTimeout(() => {
                    hideSpeechBubble();
                }, duration);
            }
        }
    }, 30); // 타이핑 속도 조절
}

// 다음 버튼 클릭 이벤트
document.getElementById('next-speech-btn').addEventListener('click', () => {
    if (onNextCallback) {
        onNextCallback();
    } else {
        hideSpeechBubble();
    }
});

// 디버그 모드 변수
let debugMode = false;
let selectedDebugElement = null;
let debugPositions = {};

// 디버그 모드 초기화
function initializeDebugMode() {
    const debugToggleBtn = document.getElementById('debug-toggle-btn');
    const debugPanel = document.getElementById('debug-panel');
    const closeDebugBtn = document.getElementById('close-debug');
    const debugXSlider = document.getElementById('debug-x-slider');
    const debugYSlider = document.getElementById('debug-y-slider');
    const debugSizeSlider = document.getElementById('debug-size-slider');
    const debugRotationSlider = document.getElementById('debug-rotation-slider');
    const debugSaveBtn = document.getElementById('debug-save-btn');
    const debugResetBtn = document.getElementById('debug-reset-btn');
    
    // 저장된 위치 불러오기
    loadDebugPositions();
    
    // 디버그 모드 토글
    debugToggleBtn.addEventListener('click', () => {
        debugMode = !debugMode;
        if (debugMode) {
            document.body.classList.add('debug-mode');
            debugPanel.style.display = 'block';
        } else {
            document.body.classList.remove('debug-mode');
            debugPanel.style.display = 'none';
            selectedDebugElement = null;
            updateDebugPanel();
        }
    });
    
    // 디버그 패널 닫기
    closeDebugBtn.addEventListener('click', () => {
        debugMode = false;
        document.body.classList.remove('debug-mode');
        debugPanel.style.display = 'none';
        selectedDebugElement = null;
        updateDebugPanel();
    });
    
    // 이미지 클릭 이벤트 (디버그 모드에서만)
    document.addEventListener('click', (e) => {
        if (!debugMode) return;
        
        // 클릭된 요소가 이미지인 경우 부모 요소 찾기
        let target = e.target;
        
        // 이미지가 클릭된 경우 부모 요소 찾기
        if (target.tagName === 'IMG') {
            target = target.closest('.china-utensil, .china-table-image-1, .china-table-image, .soup-bowl-image, .hand-draggable, .top-cheftable, .card-napkin, .dropped-item, .cheftable-rice-bowl, #grab-image, .drop-zone');
        } else {
            target = target.closest('.china-utensil, .china-table-image-1, .china-table-image, .soup-bowl-image, .hand-draggable, .top-cheftable, .card-napkin, .dropped-item, .cheftable-rice-bowl, #grab-image, .drop-zone');
        }
        
        if (target) {
            e.stopPropagation();
            e.preventDefault();
            selectDebugElement(target);
        } else if (!e.target.closest('.debug-panel') && !e.target.closest('#debug-toggle-btn')) {
            selectedDebugElement = null;
            updateDebugPanel();
        }
    });
    
    // 슬라이더 이벤트
    debugXSlider.addEventListener('input', (e) => {
        if (!selectedDebugElement) return;
        const value = parseFloat(e.target.value);
        document.getElementById('debug-x-value').textContent = value.toFixed(1);
        updateElementPosition(selectedDebugElement, value, null);
    });
    
    debugYSlider.addEventListener('input', (e) => {
        if (!selectedDebugElement) return;
        const value = parseFloat(e.target.value);
        document.getElementById('debug-y-value').textContent = value.toFixed(1);
        updateElementPosition(selectedDebugElement, null, value);
    });
    
    // 크기 슬라이더 이벤트
    debugSizeSlider.addEventListener('input', (e) => {
        if (!selectedDebugElement) return;
        const value = parseFloat(e.target.value);
        document.getElementById('debug-size-value').textContent = value;
        updateElementSize(selectedDebugElement, value);
    });
    
    // 회전 슬라이더 이벤트
    debugRotationSlider.addEventListener('input', (e) => {
        if (!selectedDebugElement) return;
        const value = parseFloat(e.target.value);
        document.getElementById('debug-rotation-value').textContent = value;
        updateElementRotation(selectedDebugElement, value);
    });
    
    // 저장 버튼
    debugSaveBtn.addEventListener('click', () => {
        if (!selectedDebugElement) return;
        saveDebugPosition(selectedDebugElement);
    });
    
    // 초기화 버튼
    debugResetBtn.addEventListener('click', () => {
        if (!selectedDebugElement) return;
        resetDebugPosition(selectedDebugElement);
    });
}

// 디버그 요소 선택
function selectDebugElement(element) {
    // 기존 선택 해제
    document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
    
    selectedDebugElement = element;
    element.classList.add('selected');
    
    updateDebugPanel();
}

// 디버그 패널 업데이트
function updateDebugPanel() {
    const selectedElementSpan = document.getElementById('debug-selected-element');
    const debugXSlider = document.getElementById('debug-x-slider');
    const debugYSlider = document.getElementById('debug-y-slider');
    const debugSizeSlider = document.getElementById('debug-size-slider');
    const debugRotationSlider = document.getElementById('debug-rotation-slider');
    const debugXValue = document.getElementById('debug-x-value');
    const debugYValue = document.getElementById('debug-y-value');
    const debugSizeValue = document.getElementById('debug-size-value');
    const debugRotationValue = document.getElementById('debug-rotation-value');
    
    if (!selectedDebugElement) {
        selectedElementSpan.textContent = '없음';
        debugXSlider.value = 50;
        debugYSlider.value = 50;
        debugSizeSlider.value = 80;
        debugRotationSlider.value = 0;
        debugXValue.textContent = '50.0';
        debugYValue.textContent = '50.0';
        debugSizeValue.textContent = '80';
        debugRotationValue.textContent = '0';
        return;
    }
    
    // 요소 이름 가져오기
    let elementName = '알 수 없음';
    const id = selectedDebugElement.id;
    const classList = selectedDebugElement.classList;
    
    if (id === 'grab-image') elementName = 'grab-image';
    else if (classList.contains('cn-spoon')) elementName = 'cn-spoon';
    else if (classList.contains('cn-chopstick')) elementName = 'cn-chopstick';
    else if (classList.contains('cn-rice')) elementName = 'cn-rice';
    else if (classList.contains('cn-dish')) elementName = 'cn-dish';
    else if (classList.contains('china-table-image-1')) elementName = 'cn-table1';
    else if (classList.contains('china-table-image')) elementName = 'cn-table2';
    else if (classList.contains('soup-bowl-image')) {
        const stage = selectedDebugElement.closest('#japan-stage, #china-stage');
        elementName = stage && stage.id === 'china-stage' ? 'soup-bowl-china' : 'soup-bowl-japan';
    }
    else if (classList.contains('hand-draggable')) {
        const stage = selectedDebugElement.closest('#japan-stage, #china-stage');
        elementName = stage && stage.id === 'china-stage' ? 'hand-china' : 'hand-japan';
    }
    else if (classList.contains('top-cheftable')) {
        const stage = selectedDebugElement.closest('#japan-stage, #china-stage');
        elementName = stage && stage.id === 'china-stage' ? 'cheftable-china' : 'cheftable-japan';
    }
    else if (classList.contains('card-napkin')) {
        const stage = selectedDebugElement.closest('#japan-stage, #china-stage');
        elementName = stage && stage.id === 'china-stage' ? 'card-napkin-china' : 'card-napkin-japan';
    }
    else if (classList.contains('dropped-item')) {
        const itemType = selectedDebugElement.getAttribute('data-item-type');
        const stage = selectedDebugElement.closest('#japan-stage, #china-stage');
        const stageName = stage && stage.id === 'china-stage' ? '-china' : '-japan';
        elementName = `dropped-${itemType}${stageName}`;
    }
    else if (classList.contains('cheftable-rice-bowl')) {
        const stage = selectedDebugElement.closest('#japan-stage, #china-stage');
        elementName = stage && stage.id === 'china-stage' ? 'cheftable-rice-bowl-china' : 'cheftable-rice-bowl-japan';
    }
    else if (classList.contains('drop-zone')) {
        const itemType = selectedDebugElement.getAttribute('data-item');
        const stage = selectedDebugElement.closest('#japan-stage, #china-stage');
        const stageName = stage && stage.id === 'china-stage' ? '-china' : '-japan';
        elementName = `drop-zone-${itemType}${stageName}`;
    }
    
    selectedElementSpan.textContent = elementName;
    
    // 현재 위치 가져오기
    const computedStyle = window.getComputedStyle(selectedDebugElement);
    const left = parseFloat(computedStyle.left) || 0;
    const top = parseFloat(computedStyle.top) || 0;
    
    // 퍼센트로 변환 (부모 요소 기준)
    const parent = selectedDebugElement.parentElement;
    const parentRect = parent ? parent.getBoundingClientRect() : { width: window.innerWidth, height: window.innerHeight };
    const xPercent = (left / parentRect.width) * 100;
    const yPercent = (top / parentRect.height) * 100;
    
    debugXSlider.value = xPercent;
    debugYSlider.value = yPercent;
    debugXValue.textContent = xPercent.toFixed(1);
    debugYValue.textContent = yPercent.toFixed(1);
    
    // 현재 크기 가져오기
    let img = selectedDebugElement.querySelector('img');
    
    // 배경 이미지인 경우 (top-cheftable, card-napkin)
    // 드랍존은 크기 조정 불가
    if (!img && (selectedDebugElement.classList.contains('top-cheftable') || selectedDebugElement.classList.contains('card-napkin') || selectedDebugElement.classList.contains('drop-zone'))) {
        // 배경 이미지나 드랍존은 크기 조정 불가
        debugSizeSlider.value = 100;
        debugSizeValue.textContent = '100';
        debugSizeSlider.disabled = true;
    } else {
        debugSizeSlider.disabled = false;
    }
    
    if (img) {
        const computedStyle = window.getComputedStyle(img);
        const currentWidth = parseFloat(computedStyle.width) || 0;
        const currentHeight = parseFloat(computedStyle.height) || 0;
        
        // 원본 크기 가져오기 (이미지가 로드된 경우)
        if (img.naturalWidth > 0 && img.naturalHeight > 0) {
            const naturalWidth = img.naturalWidth;
            const naturalHeight = img.naturalHeight;
            
            // 현재 크기를 원본 대비 퍼센트로 계산
            const widthPercent = (currentWidth / naturalWidth) * 100;
            const heightPercent = (currentHeight / naturalHeight) * 100;
            const avgPercent = (widthPercent + heightPercent) / 2;
            
            debugSizeSlider.value = avgPercent;
            debugSizeValue.textContent = Math.round(avgPercent);
        } else {
            // 이미지가 아직 로드되지 않은 경우 기본값
            debugSizeSlider.value = 80;
            debugSizeValue.textContent = '80';
        }
    } else {
        debugSizeSlider.value = 80;
        debugSizeValue.textContent = '80';
    }
    
    // 현재 회전 값 가져오기
    const rotationComputedStyle = window.getComputedStyle(selectedDebugElement);
    const rotationTransform = rotationComputedStyle.transform;
    let rotation = 0;
    
    if (rotationTransform && rotationTransform !== 'none') {
        // 먼저 rotate(...deg) 형태 확인
        const rotateMatch = rotationTransform.match(/rotate\(([^)]+)\)/);
        if (rotateMatch) {
            const rotateValue = rotateMatch[1];
            const degMatch = rotateValue.match(/(-?\d+(?:\.\d+)?)/);
            if (degMatch) {
                rotation = Math.round(parseFloat(degMatch[1]));
            }
        } else {
            // matrix() 형태에서 회전 각도 추출
            const matrix = rotationTransform.match(/matrix\(([^)]+)\)/);
            if (matrix) {
                const values = matrix[1].split(',').map(v => parseFloat(v.trim()));
                if (values.length >= 4) {
                    // matrix(a, b, c, d, e, f)에서 회전 각도 계산
                    const a = values[0];
                    const b = values[1];
                    rotation = Math.round(Math.atan2(b, a) * (180 / Math.PI));
                }
            }
        }
    }
    
    // 이미지 요소의 transform도 확인
    const rotationImg = selectedDebugElement.querySelector('img');
    if (rotationImg) {
        const imgTransform = window.getComputedStyle(rotationImg).transform;
        if (imgTransform && imgTransform !== 'none') {
            // 먼저 rotate(...deg) 형태 확인
            const rotateMatch = imgTransform.match(/rotate\(([^)]+)\)/);
            if (rotateMatch) {
                const rotateValue = rotateMatch[1];
                const degMatch = rotateValue.match(/(-?\d+(?:\.\d+)?)/);
                if (degMatch) {
                    const imgRotation = Math.round(parseFloat(degMatch[1]));
                    if (imgRotation !== 0) {
                        rotation = imgRotation;
                    }
                }
            } else {
                // matrix() 형태에서 회전 각도 추출
                const matrix = imgTransform.match(/matrix\(([^)]+)\)/);
                if (matrix) {
                    const values = matrix[1].split(',').map(v => parseFloat(v.trim()));
                    if (values.length >= 4) {
                        const a = values[0];
                        const b = values[1];
                        const imgRotation = Math.round(Math.atan2(b, a) * (180 / Math.PI));
                        if (imgRotation !== 0) {
                            rotation = imgRotation;
                        }
                    }
                }
            }
        }
    }
    
    debugRotationSlider.value = rotation;
    debugRotationValue.textContent = rotation;
}

// 요소 위치 업데이트
function updateElementPosition(element, x, y) {
    if (x !== null) {
        element.style.left = `${x}%`;
    }
    if (y !== null) {
        element.style.top = `${y}%`;
    }
}

// 요소 회전 업데이트
function updateElementRotation(element, rotationDegrees) {
    const img = element.querySelector('img');
    
    // 이미지가 있으면 이미지에 회전 적용
    if (img) {
        // 기존 transform에서 translate 값 유지하고 rotate만 변경
        const computedStyle = window.getComputedStyle(img);
        const currentTransform = computedStyle.transform;
        let transformParts = [];
        
        // 기존 transform에서 translate 부분 추출
        if (currentTransform && currentTransform !== 'none') {
            // translate(...) 부분 찾기
            const translateMatch = currentTransform.match(/translate\(([^)]+)\)/);
            if (translateMatch) {
                transformParts.push(`translate(${translateMatch[1]})`);
            }
            
            // translateX(...) 또는 translateY(...) 부분 찾기
            const translateXMatch = currentTransform.match(/translateX\(([^)]+)\)/);
            const translateYMatch = currentTransform.match(/translateY\(([^)]+)\)/);
            if (translateXMatch) {
                transformParts.push(`translateX(${translateXMatch[1]})`);
            }
            if (translateYMatch) {
                transformParts.push(`translateY(${translateYMatch[1]})`);
            }
            
            // matrix() 형태에서 translate 추출
            if (transformParts.length === 0) {
                const matrix = currentTransform.match(/matrix\(([^)]+)\)/);
                if (matrix) {
                    const values = matrix[1].split(',').map(v => parseFloat(v.trim()));
                    if (values.length >= 6) {
                        const translateX = values[4];
                        const translateY = values[5];
                        if (translateX !== 0 || translateY !== 0) {
                            transformParts.push(`translate(${translateX}px, ${translateY}px)`);
                        }
                    }
                }
            }
        }
        
        // rotate 추가
        transformParts.push(`rotate(${rotationDegrees}deg)`);
        
        // transform 결합
        img.style.transform = transformParts.join(' ');
    } else {
        // 이미지가 없으면 요소 자체에 회전 적용
        const computedStyle = window.getComputedStyle(element);
        const currentTransform = computedStyle.transform;
        let transformParts = [];
        
        // 기존 transform에서 translate 부분 추출
        if (currentTransform && currentTransform !== 'none') {
            // translate(...) 부분 찾기
            const translateMatch = currentTransform.match(/translate\(([^)]+)\)/);
            if (translateMatch) {
                transformParts.push(`translate(${translateMatch[1]})`);
            }
            
            // translateX(...) 또는 translateY(...) 부분 찾기
            const translateXMatch = currentTransform.match(/translateX\(([^)]+)\)/);
            const translateYMatch = currentTransform.match(/translateY\(([^)]+)\)/);
            if (translateXMatch) {
                transformParts.push(`translateX(${translateXMatch[1]})`);
            }
            if (translateYMatch) {
                transformParts.push(`translateY(${translateYMatch[1]})`);
            }
            
            // matrix() 형태에서 translate 추출
            if (transformParts.length === 0) {
                const matrix = currentTransform.match(/matrix\(([^)]+)\)/);
                if (matrix) {
                    const values = matrix[1].split(',').map(v => parseFloat(v.trim()));
                    if (values.length >= 6) {
                        const translateX = values[4];
                        const translateY = values[5];
                        if (translateX !== 0 || translateY !== 0) {
                            transformParts.push(`translate(${translateX}px, ${translateY}px)`);
                        }
                    }
                }
            }
        }
        
        // rotate 추가
        transformParts.push(`rotate(${rotationDegrees}deg)`);
        
        // transform 결합
        element.style.transform = transformParts.join(' ');
    }
}

// 요소 크기 업데이트
function updateElementSize(element, sizePercent) {
    // 배경 이미지는 크기 조정 불가
    if (element.classList.contains('top-cheftable') || element.classList.contains('card-napkin')) {
        return;
    }
    
    const img = element.querySelector('img');
    if (!img) return;
    
    // 이미지가 로드될 때까지 대기
    if (img.naturalWidth === 0 || img.naturalHeight === 0) {
        img.onload = function() {
            updateElementSize(element, sizePercent);
        };
        return;
    }
    
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;
    
    const newWidth = (naturalWidth * sizePercent) / 100;
    const newHeight = (naturalHeight * sizePercent) / 100;
    
    img.style.width = `${newWidth}px`;
    img.style.height = `${newHeight}px`;
}

// 디버그 위치 저장
function saveDebugPosition(element) {
    let elementName = '';
    const id = element.id;
    const classList = element.classList;
    
    if (id === 'grab-image') elementName = 'grab-image';
    else if (classList.contains('cn-spoon')) elementName = 'cn-spoon';
    else if (classList.contains('cn-chopstick')) elementName = 'cn-chopstick';
    else if (classList.contains('cn-rice')) elementName = 'cn-rice';
    else if (classList.contains('cn-dish')) elementName = 'cn-dish';
    else if (classList.contains('china-table-image-1')) elementName = 'cn-table1';
    else if (classList.contains('china-table-image')) elementName = 'cn-table2';
    else if (classList.contains('soup-bowl-image')) {
        const stage = element.closest('#japan-stage, #china-stage');
        elementName = stage && stage.id === 'china-stage' ? 'soup-bowl-china' : 'soup-bowl-japan';
    }
    else if (classList.contains('hand-draggable')) {
        const stage = element.closest('#japan-stage, #china-stage');
        elementName = stage && stage.id === 'china-stage' ? 'hand-china' : 'hand-japan';
    }
    else if (classList.contains('top-cheftable')) {
        const stage = element.closest('#japan-stage, #china-stage');
        elementName = stage && stage.id === 'china-stage' ? 'cheftable-china' : 'cheftable-japan';
    }
    else if (classList.contains('card-napkin')) {
        const stage = element.closest('#japan-stage, #china-stage');
        elementName = stage && stage.id === 'china-stage' ? 'card-napkin-china' : 'card-napkin-japan';
    }
    else if (classList.contains('dropped-item')) {
        const itemType = element.getAttribute('data-item-type');
        const stage = element.closest('#japan-stage, #china-stage');
        const stageName = stage && stage.id === 'china-stage' ? '-china' : '-japan';
        elementName = `dropped-${itemType}${stageName}`;
    }
    else if (classList.contains('cheftable-rice-bowl')) {
        const stage = element.closest('#japan-stage, #china-stage');
        elementName = stage && stage.id === 'china-stage' ? 'cheftable-rice-bowl-china' : 'cheftable-rice-bowl-japan';
    }
    else if (classList.contains('drop-zone')) {
        const itemType = element.getAttribute('data-item');
        const stage = element.closest('#japan-stage, #china-stage');
        const stageName = stage && stage.id === 'china-stage' ? '-china' : '-japan';
        elementName = `drop-zone-${itemType}${stageName}`;
    }
    
    if (!elementName || elementName === '알 수 없음') return;
    
    const saveComputedStyle = window.getComputedStyle(element);
    const left = parseFloat(saveComputedStyle.left) || 0;
    const top = parseFloat(saveComputedStyle.top) || 0;
    
    const parent = element.parentElement;
    const parentRect = parent ? parent.getBoundingClientRect() : { width: window.innerWidth, height: window.innerHeight };
    const xPercent = (left / parentRect.width) * 100;
    const yPercent = (top / parentRect.height) * 100;
    
    // 크기 정보 가져오기
    let sizePercent = 80;
    if (element.classList.contains('top-cheftable') || element.classList.contains('card-napkin') || element.classList.contains('drop-zone')) {
        sizePercent = 100; // 배경 이미지나 드랍존은 크기 조정 불가
    } else {
        const saveSizeImg = element.querySelector('img');
        if (saveSizeImg && saveSizeImg.naturalWidth > 0 && saveSizeImg.naturalHeight > 0) {
            const imgComputedStyle = window.getComputedStyle(saveSizeImg);
            const currentWidth = parseFloat(imgComputedStyle.width) || 0;
            const widthPercent = (currentWidth / saveSizeImg.naturalWidth) * 100;
            const currentHeight = parseFloat(imgComputedStyle.height) || 0;
            const heightPercent = (currentHeight / saveSizeImg.naturalHeight) * 100;
            sizePercent = (widthPercent + heightPercent) / 2;
        }
    }
    
    // 회전 정보 가져오기
    let rotation = 0;
    const saveRotationTransform = saveComputedStyle.transform;
    
    if (saveRotationTransform && saveRotationTransform !== 'none') {
        // 먼저 rotate(...deg) 형태 확인
        const rotateMatch = saveRotationTransform.match(/rotate\(([^)]+)\)/);
        if (rotateMatch) {
            const rotateValue = rotateMatch[1];
            const degMatch = rotateValue.match(/(-?\d+(?:\.\d+)?)/);
            if (degMatch) {
                rotation = Math.round(parseFloat(degMatch[1]));
            }
        } else {
            // matrix() 형태에서 회전 각도 추출
            const matrix = saveRotationTransform.match(/matrix\(([^)]+)\)/);
            if (matrix) {
                const values = matrix[1].split(',').map(v => parseFloat(v.trim()));
                if (values.length >= 4) {
                    const a = values[0];
                    const b = values[1];
                    rotation = Math.round(Math.atan2(b, a) * (180 / Math.PI));
                }
            }
        }
    }
    
    // 이미지 요소의 transform도 확인
    const saveImg = element.querySelector('img');
    if (saveImg) {
        const imgTransform = window.getComputedStyle(saveImg).transform;
        if (imgTransform && imgTransform !== 'none') {
            // 먼저 rotate(...deg) 형태 확인
            const rotateMatch = imgTransform.match(/rotate\(([^)]+)\)/);
            if (rotateMatch) {
                const rotateValue = rotateMatch[1];
                const degMatch = rotateValue.match(/(-?\d+(?:\.\d+)?)/);
                if (degMatch) {
                    const imgRotation = Math.round(parseFloat(degMatch[1]));
                    if (imgRotation !== 0) {
                        rotation = imgRotation;
                    }
                }
            } else {
                // matrix() 형태에서 회전 각도 추출
                const matrix = imgTransform.match(/matrix\(([^)]+)\)/);
                if (matrix) {
                    const values = matrix[1].split(',').map(v => parseFloat(v.trim()));
                    if (values.length >= 4) {
                        const a = values[0];
                        const b = values[1];
                        const imgRotation = Math.round(Math.atan2(b, a) * (180 / Math.PI));
                        if (imgRotation !== 0) {
                            rotation = imgRotation;
                        }
                    }
                }
            }
        }
    }
    
    debugPositions[elementName] = { x: xPercent, y: yPercent, size: sizePercent, rotation: rotation };
    
    // localStorage에 저장
    localStorage.setItem('debugPositions', JSON.stringify(debugPositions));
    
    alert(`${elementName} 위치, 크기, 회전이 저장되었습니다!`);
}

// 디버그 위치 불러오기
function loadDebugPositions() {
    const saved = localStorage.getItem('debugPositions');
    if (saved) {
        debugPositions = JSON.parse(saved);
        applyDebugPositions();
    }
}

// 저장된 위치 적용
function applyDebugPositions() {
    Object.keys(debugPositions).forEach(elementName => {
        const position = debugPositions[elementName];
        let element = null;
        
        if (elementName === 'cn-spoon') element = document.querySelector('.cn-spoon');
        else if (elementName === 'cn-chopstick') element = document.querySelector('.cn-chopstick');
        else if (elementName === 'cn-rice') element = document.querySelector('.cn-rice');
        else if (elementName === 'cn-dish') element = document.querySelector('.cn-dish');
        else if (elementName === 'cn-table1') element = document.querySelector('.china-table-image-1');
        else if (elementName === 'cn-table2') element = document.querySelector('.china-table-image');
        else if (elementName === 'grab-image') element = document.getElementById('grab-image');
        else if (elementName === 'soup-bowl-japan') element = document.querySelector('#japan-stage .soup-bowl-image');
        else if (elementName === 'soup-bowl-china') element = document.querySelector('#china-stage .soup-bowl-image');
        else if (elementName === 'hand-japan') element = document.querySelector('#japan-stage .hand-draggable');
        else if (elementName === 'hand-china') element = document.querySelector('#china-stage .hand-draggable');
        else if (elementName === 'cheftable-japan') element = document.querySelector('#japan-stage .top-cheftable');
        else if (elementName === 'cheftable-china') element = document.querySelector('#china-stage .top-cheftable');
        else if (elementName === 'card-napkin-japan') element = document.querySelector('#japan-stage .card-napkin');
        else if (elementName === 'card-napkin-china') element = document.querySelector('#china-stage .card-napkin');
        else if (elementName.startsWith('dropped-')) {
            // 드롭된 아이템은 동적으로 생성되므로 나중에 적용
            return;
        }
        else if (elementName === 'cheftable-rice-bowl-japan') element = document.querySelector('#japan-stage .cheftable-rice-bowl');
        else if (elementName === 'cheftable-rice-bowl-china') element = document.querySelector('#china-stage .cheftable-rice-bowl');
        else if (elementName === 'drop-zone-rice-bowl-japan') element = document.querySelector('#japan-stage #drop-rice-bowl');
        else if (elementName === 'drop-zone-spoon-japan') element = document.querySelector('#japan-stage #drop-spoon');
        else if (elementName === 'drop-zone-chopsticks-japan') element = document.querySelector('#japan-stage #drop-chopsticks');
        else if (elementName.startsWith('drop-zone-')) {
            // 중국 스테이지 드랍존은 동적으로 생성될 수 있으므로 나중에 적용
            const parts = elementName.split('-');
            const itemType = parts[2]; // rice-bowl, spoon, chopsticks
            const stageName = parts[3]; // china
            if (stageName === 'china') {
                element = document.querySelector(`#china-stage #drop-${itemType}`);
            }
        }
        
        if (element) {
            element.style.left = `${position.x}%`;
            element.style.top = `${position.y}%`;
            
            // 드랍존의 경우 transform과 margin 초기화 (저장된 위치 사용 시)
            if (element.classList.contains('drop-zone')) {
                // 저장된 위치가 있으면 기본 transform과 margin 제거
                if (elementName === 'drop-zone-spoon-japan') {
                    element.style.marginLeft = '';
                } else if (elementName === 'drop-zone-chopsticks-japan') {
                    element.style.marginTop = '';
                    // transform은 유지 (회전이 필요할 수 있음)
                }
            }
            
            // 크기 적용 (드랍존은 크기 조정 불가)
            if (position.size && !element.classList.contains('drop-zone')) {
                updateElementSize(element, position.size);
            }
            
            // 회전 적용
            if (position.rotation !== undefined) {
                updateElementRotation(element, position.rotation);
            }
        }
    });
}

// 디버그 위치 초기화
function resetDebugPosition(element) {
    let elementName = '';
    const id = element.id;
    const classList = element.classList;
    
    if (id === 'grab-image') elementName = 'grab-image';
    else if (classList.contains('cn-spoon')) elementName = 'cn-spoon';
    else if (classList.contains('cn-chopstick')) elementName = 'cn-chopstick';
    else if (classList.contains('cn-rice')) elementName = 'cn-rice';
    else if (classList.contains('cn-dish')) elementName = 'cn-dish';
    else if (classList.contains('china-table-image-1')) elementName = 'cn-table1';
    else if (classList.contains('china-table-image')) elementName = 'cn-table2';
    else if (classList.contains('soup-bowl-image')) {
        const stage = element.closest('#japan-stage, #china-stage');
        elementName = stage && stage.id === 'china-stage' ? 'soup-bowl-china' : 'soup-bowl-japan';
    }
    else if (classList.contains('hand-draggable')) {
        const stage = element.closest('#japan-stage, #china-stage');
        elementName = stage && stage.id === 'china-stage' ? 'hand-china' : 'hand-japan';
    }
    else if (classList.contains('top-cheftable')) {
        const stage = element.closest('#japan-stage, #china-stage');
        elementName = stage && stage.id === 'china-stage' ? 'cheftable-china' : 'cheftable-japan';
    }
    else if (classList.contains('card-napkin')) {
        const stage = element.closest('#japan-stage, #china-stage');
        elementName = stage && stage.id === 'china-stage' ? 'card-napkin-china' : 'card-napkin-japan';
    }
    else if (classList.contains('dropped-item')) {
        const itemType = element.getAttribute('data-item-type');
        const stage = element.closest('#japan-stage, #china-stage');
        const stageName = stage && stage.id === 'china-stage' ? '-china' : '-japan';
        elementName = `dropped-${itemType}${stageName}`;
    }
    else if (classList.contains('cheftable-rice-bowl')) {
        const stage = element.closest('#japan-stage, #china-stage');
        elementName = stage && stage.id === 'china-stage' ? 'cheftable-rice-bowl-china' : 'cheftable-rice-bowl-japan';
    }
    else if (classList.contains('drop-zone')) {
        const itemType = element.getAttribute('data-item');
        const stage = element.closest('#japan-stage, #china-stage');
        const stageName = stage && stage.id === 'china-stage' ? '-china' : '-japan';
        elementName = `drop-zone-${itemType}${stageName}`;
    }
    
    if (!elementName || elementName === '알 수 없음') return;
    
    // 기본 위치로 복원 (CSS에서 정의된 기본값)
    delete debugPositions[elementName];
    localStorage.setItem('debugPositions', JSON.stringify(debugPositions));
    
    // CSS 기본값으로 복원
    if (elementName === 'cn-spoon') {
        element.style.left = '70%';
        element.style.top = '40%';
    } else if (elementName === 'cn-chopstick') {
        element.style.left = '30%';
        element.style.top = '40%';
    } else if (elementName === 'cn-rice') {
        element.style.left = '50%';
        element.style.top = '30%';
    } else if (elementName === 'cn-dish') {
        element.style.left = '50%';
        element.style.top = '60%';
    } else if (elementName === 'cn-table1') {
        element.style.left = '-35%';
        element.style.top = '-189%';
    } else if (elementName === 'cn-table2') {
        element.style.left = '50%';
        element.style.top = '47%';
    }
    
    // 드랍존의 경우 스타일 제거하여 기본값으로 복원
    if (element.classList.contains('drop-zone')) {
        element.style.left = '';
        element.style.top = '';
    } else {
        // 크기도 기본값(80%)으로 복원
        const resetImg = element.querySelector('img');
        if (resetImg) {
            updateElementSize(element, 80);
        }
    }
    
    // 회전 초기화
    const resetRotationImg = element.querySelector('img');
    if (resetRotationImg) {
        resetRotationImg.style.transform = '';
    } else {
        element.style.transform = '';
    }
    
    updateDebugPanel();
    alert(`${elementName} 위치, 크기, 회전이 초기화되었습니다!`);
}

// 페이지 로드 시 디버그 모드 초기화
window.addEventListener('DOMContentLoaded', () => {
    initializeDebugMode();
    // 저장된 위치 적용 (중국 스테이지 초기화 후)
    setTimeout(() => {
        applyDebugPositions();
    }, 100);
});

// 말풍선 숨기기
function hideSpeechBubble() {
    const speechBubble = document.getElementById('speech-bubble');
    const nextBtn = document.getElementById('next-speech-btn');
    if (speechBubble) {
        speechBubble.classList.remove('show');
    }
    if (nextBtn) {
        nextBtn.style.display = 'none';
    }
    onNextCallback = null;
}

// 즉시 텍스트 표시 (타이핑 효과 없이)
function setSpeechBubbleText(text, duration = 3000) {
    const speechBubble = document.getElementById('speech-bubble');
    const speechText = document.getElementById('speech-text');
    
    if (!speechBubble || !speechText) return;
    
    speechText.textContent = text;
    speechBubble.classList.add('show');
    
    if (duration > 0) {
        setTimeout(() => {
            hideSpeechBubble();
        }, duration);
    }
}

