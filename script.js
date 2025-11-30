// 버튼 텍스트 설정
const BUTTON_TEXTS = {
    next: '고마워',
    nextJapan: '고마워',
    nextChina: '고마워',
    nextFrance: '고마워'
};

// 화면 전환 관리
const screens = {
    title: document.getElementById('title-screen'),
    map: document.getElementById('map-screen'),
    japan: document.getElementById('japan-stage'),
    china: document.getElementById('china-stage'),
    france: document.getElementById('france-stage')
};

// vw 단위 변환 함수
function pxToVw(px) {
    return (px / window.innerWidth) * 100;
}

// 타이틀 이미지 크기 및 위치 조정
function adjustTitleImages() {
    const titleScreen = document.getElementById('title-screen');
    if (!titleScreen) return;

    const images = {
        'map': document.querySelector('.title-map-image'),
        'spoon': document.querySelector('.title-spoon-image'),
        'chopsticks': document.querySelector('.title-chopsticks-image'),
        'cheftable': document.querySelector('.title-cheftable-image')
    };

    let loadedCount = 0;
    const totalImages = Object.keys(images).length;

    Object.entries(images).forEach(([key, img]) => {
        if (!img) {
            loadedCount++;
            return;
        }

        // 이미지 크기와 위치를 즉시 설정 (이미지가 로드되지 않았어도)
        setImageSizeAndPosition(img, key);

        if (img.complete && img.naturalWidth > 0) {
            // 이미 로드된 경우 다시 한 번 설정 (정확한 크기 계산을 위해)
            setImageSizeAndPosition(img, key);
            loadedCount++;
            if (loadedCount === totalImages) {
                // 모든 이미지 로드 완료
            }
        } else {
            // 로드 대기
            img.onload = () => {
                setImageSizeAndPosition(img, key);
                loadedCount++;
                if (loadedCount === totalImages) {
                    // 모든 이미지 로드 완료
                }
            };
            // 이미지가 로드되지 않았어도 카운트 증가 (타임아웃 방지)
            loadedCount++;
        }
    });
}

function setImageSizeAndPosition(img, key) {
    if (!img) return;

    let targetWidthVw;
    let topVw, leftVw, rightVw, bottomVw;

    switch (key) {
        case 'map':
            targetWidthVw = 40;
            topVw = 10;
            leftVw = 10;
            break;
        case 'spoon':
            targetWidthVw = 15;
            topVw = 0;
            leftVw = 0;
            break;
        case 'chopsticks':
            targetWidthVw = 15;
            bottomVw = 20;
            leftVw = 15;
            break;
        case 'cheftable':
            targetWidthVw = 25;
            bottomVw = 10;
            rightVw = 10;
            break;
    }

    // vw 단위로 크기 설정 (이미지가 로드되지 않았어도 크기 설정)
    img.style.width = `${targetWidthVw}vw`;
    img.style.height = 'auto';

    // 위치 설정
    if (topVw !== undefined) {
        img.style.top = `${topVw}vw`;
        img.style.bottom = ''; // bottom과 충돌 방지
    }
    if (leftVw !== undefined) {
        img.style.left = `${leftVw}vw`;
        img.style.right = ''; // right와 충돌 방지
    }
    if (rightVw !== undefined) {
        img.style.right = `${rightVw}vw`;
        img.style.left = ''; // left와 충돌 방지
    }
    if (bottomVw !== undefined) {
        img.style.bottom = `${bottomVw}vw`;
        img.style.top = ''; // top과 충돌 방지
    }

    // position이 absolute인지 확인 (CSS에서 설정되어야 함)
    if (window.getComputedStyle(img).position === 'static') {
        img.style.position = 'absolute';
    }
}

// 각 파일에서 존재하는 스테이지만 초기화 (DOM 로드 후)
document.addEventListener('DOMContentLoaded', () => {
    // 타이틀 화면 이미지 조정 (이미지 제거됨)
    // if (document.getElementById('title-screen')) {
    //     adjustTitleImages();
    //     // 윈도우 리사이즈 시에도 조정
    //     window.addEventListener('resize', adjustTitleImages);
    // }

    // URL 파라미터 확인하여 맵 화면 활성화
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('screen') === 'map' && document.getElementById('map-screen')) {
        showScreen('map');
    }

    if (document.getElementById('japan-stage')) {
        const slotMenuJapan = document.getElementById('slot-menu-japan');
        if (slotMenuJapan) slotMenuJapan.style.display = 'block';
        initializeJapanStage();
    }

    if (document.getElementById('china-stage')) {
        const slotMenuChina = document.getElementById('slot-menu-china');
        if (slotMenuChina) slotMenuChina.style.display = 'flex';
        initializeChinaStage();
    }

    if (document.getElementById('france-stage')) {
        const slotMenuFrance = document.getElementById('slot-menu-france');
        if (slotMenuFrance) slotMenuFrance.style.display = 'flex';
        initializeFranceStage();
    }
});

let currentScreen = 'title';
let japanCompleted = false;
let chinaCompleted = false;
let riceBowlEatState = 0; // 밥그릇 먹기 상태: 0=grab.png, 1=grab1.png, 2=grab2.png, 3=grab3.png, 4=grab4.png, 5=dishFinished.png

// ============================================
// 단계 관리 시스템
// ============================================
// 단계 상수 정의
const GAME_PHASE = {
    INITIAL: 'initial',           // 1. 시작
    RICE_BOWL_PLACED: 'rice_bowl_placed',  // 2. 밥그릇 놓기
    UTENSILS_PLACED: 'utensils_placed',    // 3. 수저 놓기
    MEAL_START: 'meal_start',              // 4. 식사 시작하기
    SIDE_DISH: 'side_dish',                // 5. 사이드 먹기
    CALCULATION: 'calculation'             // 6. 계산하기
};

// 현재 단계 추적 (스테이지별)
let currentPhase = {
    japan: GAME_PHASE.INITIAL,
    china: GAME_PHASE.INITIAL
};

// 단계 확인 함수들
function getCurrentPhase(stage = 'japan') {
    return currentPhase[stage] || GAME_PHASE.INITIAL;
}

function isPhase(stage, phase) {
    return getCurrentPhase(stage) === phase;
}

function setPhase(stage, phase) {
    if (Object.values(GAME_PHASE).includes(phase)) {
        currentPhase[stage] = phase;
        console.log(`[${stage}] Phase changed to: ${phase}`);
    }
}

// 단계별 체크 함수들
function isInitialPhase(stage = 'japan') {
    return isPhase(stage, GAME_PHASE.INITIAL);
}

function isRiceBowlPlacedPhase(stage = 'japan') {
    return isPhase(stage, GAME_PHASE.RICE_BOWL_PLACED);
}

function isUtensilsPlacedPhase(stage = 'japan') {
    return isPhase(stage, GAME_PHASE.UTENSILS_PLACED);
}

function isMealStartPhase(stage = 'japan') {
    return isPhase(stage, GAME_PHASE.MEAL_START);
}

function isSideDishPhase(stage = 'japan') {
    return isPhase(stage, GAME_PHASE.SIDE_DISH);
}

// 단계 초기화
function resetPhase(stage = 'japan') {
    setPhase(stage, GAME_PHASE.INITIAL);
}
// ============================================

// 정답 위치 매핑
const correctPositions = {
    'rice-bowl': 'drop-rice-bowl',
    'spoon': 'drop-spoon',
    'chopsticks': 'drop-chopsticks'
};

// 중국 스테이지 정답 위치 매핑
const correctPositionsChina = {
    'cup': 'drop-zone-cn-cup',
    'teapot': 'drop-zone-cn-teapot'
};

// 배치된 아이템 추적
const placedItems = {};

// 화면 전환 함수
function showScreen(screenName) {
    Object.values(screens).forEach(screen => {
        if (screen) {
            screen.classList.remove('active');
        }
    });

    // 헤더 버튼 표시/숨김 처리
    const backToMapJapan = document.getElementById('back-to-map-japan');
    const backToMapChina = document.getElementById('back-to-map-china');
    const backToMapFrance = document.getElementById('back-to-map-france');
    const resetStageBtn = document.getElementById('reset-stage-btn');

    if (backToMapJapan) backToMapJapan.style.display = 'none';
    if (backToMapChina) backToMapChina.style.display = 'none';
    if (backToMapFrance) backToMapFrance.style.display = 'none';
    if (resetStageBtn) resetStageBtn.style.display = 'none';

    // 슬롯 메뉴 표시/숨김 처리
    const slotMenuJapan = document.getElementById('slot-menu-japan');
    const slotMenuChina = document.getElementById('slot-menu-china');
    const slotMenuFrance = document.getElementById('slot-menu-france');

    if (slotMenuJapan) slotMenuJapan.style.display = 'none';
    if (slotMenuChina) slotMenuChina.style.display = 'none';
    if (slotMenuFrance) slotMenuFrance.style.display = 'none';

    // 헤더 제목 업데이트
    const headerTitle = document.querySelector('.header-title');
    if (headerTitle) {
        if (screenName === 'japan') {
            headerTitle.textContent = 'Japan';
        } else if (screenName === 'china') {
            headerTitle.textContent = 'China';
        } else if (screenName === 'france') {
            headerTitle.textContent = 'France';
        } else if (screenName === 'map') {
            headerTitle.textContent = 'World Map';
        } else {
            headerTitle.textContent = 'World Dining Etiquette';
        }
    }

    // map 화면으로 전환하려는데 map-screen이 없으면 index.html로 이동
    if (screenName === 'map' && !screens[screenName]) {
        window.location.href = 'index.html?screen=map';
        return;
    }

    if (screens[screenName]) {
        screens[screenName].classList.add('active');
        currentScreen = screenName;

        // 맵 화면으로 전환 시 애니메이션 트리거
        if (screenName === 'map') {
            const mapScreen = screens[screenName];
            const header = mapScreen.querySelector('.top-header');

            // 먼저 기존 애니메이션 클래스 제거
            const mapImage = mapScreen.querySelector('.title-map-image');
            const cheftable = mapScreen.querySelector('.title-cheftable-m-image');
            const spoon = mapScreen.querySelector('.title-spoon-m-image');
            const chopsticks = mapScreen.querySelector('.title-chopsticks-m-image');
            const titleText = mapScreen.querySelector('h1');

            if (mapImage) mapImage.classList.remove('map-expand');
            if (cheftable) cheftable.classList.remove('map-hide');
            if (spoon) spoon.classList.remove('map-hide');
            if (chopsticks) chopsticks.classList.remove('map-hide');
            if (titleText) titleText.classList.remove('map-hide');
            if (header) header.classList.remove('header-slide-down');

            // 브라우저 렌더링 후 애니메이션 시작
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    // 헤더 애니메이션 먼저 시작
                    if (header) {
                        header.classList.add('header-slide-down');
                    }

                    // 다른 애니메이션 클래스 추가
                    if (mapImage) {
                        mapImage.classList.add('map-expand');
                    }
                    if (cheftable) cheftable.classList.add('map-hide');
                    if (spoon) spoon.classList.add('map-hide');
                    if (chopsticks) chopsticks.classList.add('map-hide');
                    if (titleText) titleText.classList.add('map-hide');
                });
            });
        }

        // 스테이지에 따라 해당 버튼 표시
        if (screenName === 'japan' && backToMapJapan) {
            backToMapJapan.style.display = 'block';
            if (slotMenuJapan) slotMenuJapan.style.display = 'flex';
            if (resetStageBtn) resetStageBtn.style.display = 'block';
        } else if (screenName === 'china' && backToMapChina) {
            backToMapChina.style.display = 'block';
            if (slotMenuChina) slotMenuChina.style.display = 'flex';
            if (resetStageBtn) resetStageBtn.style.display = 'block';
        } else if (screenName === 'france' && backToMapFrance) {
            backToMapFrance.style.display = 'block';
            if (slotMenuFrance) slotMenuFrance.style.display = 'flex';
            if (resetStageBtn) resetStageBtn.style.display = 'block';
        }
    }
}

// 시작하기 버튼
const startBtn = document.getElementById('start-btn');
if (startBtn) {
    startBtn.addEventListener('click', () => {
        showScreen('map');
    });
}

// 일본 클릭
const japanCountry = document.querySelector('.country.korea');
if (japanCountry) {
    japanCountry.addEventListener('click', () => {
        window.location.href = 'japan.html';
    });
}

// 중국 클릭
const chinaCountry = document.querySelector('.country.china');
if (chinaCountry) {
    chinaCountry.addEventListener('click', () => {
        window.location.href = 'china.html';
    });
}

// 맵 이미지 위 일본 버튼
const japanMapBtn = document.getElementById('japan-map-btn');
if (japanMapBtn) {
    japanMapBtn.addEventListener('click', () => {
        window.location.href = 'japan.html';
    });
}

// 맵 이미지 위 중국 버튼
const chinaMapBtn = document.getElementById('china-map-btn');
if (chinaMapBtn) {
    chinaMapBtn.addEventListener('click', () => {
        window.location.href = 'china.html';
    });
}

// 맵 이미지 위 프랑스 버튼
const franceMapBtn = document.getElementById('france-map-btn');
if (franceMapBtn) {
    franceMapBtn.addEventListener('click', () => {
        window.location.href = 'france.html';
    });
}

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
            resetPhase('japan');

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
            resetPhase('china');

            // 배치된 아이템 초기화
            Object.keys(placedItems).forEach(key => delete placedItems[key]);
        }
    } else if (stageName === 'france') {
        // 프랑스 스테이지 완전 초기화
        const franceStage = document.getElementById('france-stage');
        if (franceStage) {
            // 모든 드롭 존 초기화
            franceStage.querySelectorAll('.drop-zone').forEach(zone => {
                zone.classList.remove('correct', 'filled', 'drag-over');
                const existingItem = zone.querySelector('.dropped-item');
                if (existingItem) {
                    existingItem.remove();
                }
            });

            // 말풍선 숨기기
            const speechBubble = document.getElementById('speech-bubble-france');
            if (speechBubble) {
                speechBubble.classList.remove('show');
            }

            // 정보 메뉴 닫기
            franceStage.querySelectorAll('.info-menu').forEach(menu => {
                menu.style.display = 'none';
            });

            // 타이핑 인터벌 정리
            if (currentTypingInterval) {
                clearInterval(currentTypingInterval);
                currentTypingInterval = null;
            }

            // 콜백 초기화
            onNextCallback = null;

            // 배치된 아이템 초기화
            Object.keys(placedItems).forEach(key => delete placedItems[key]);
        }
    }
}

// 지도 돌아가기 버튼
const backToMapJapan = document.getElementById('back-to-map-japan');
if (backToMapJapan) {
    backToMapJapan.addEventListener('click', () => {
        window.location.href = 'index.html?screen=map';
    });
}

const backToMapChina = document.getElementById('back-to-map-china');
if (backToMapChina) {
    backToMapChina.addEventListener('click', () => {
        window.location.href = 'index.html?screen=map';
    });
}

const backToMapFrance = document.getElementById('back-to-map-france');
if (backToMapFrance) {
    backToMapFrance.addEventListener('click', () => {
        window.location.href = 'index.html?screen=map';
    });
}

// 다시하기 버튼 클릭 이벤트
const resetStageBtn = document.getElementById('reset-stage-btn');
if (resetStageBtn) {
    resetStageBtn.addEventListener('click', () => {
        const japanStage = document.getElementById('japan-stage');
        const chinaStage = document.getElementById('china-stage');
        const franceStage = document.getElementById('france-stage');

        if (japanStage && japanStage.classList.contains('active')) {
            resetStage('japan');
            initializeJapanStage();
        } else if (chinaStage && chinaStage.classList.contains('active')) {
            resetStage('china');
            initializeChinaStage();
        } else if (franceStage && franceStage.classList.contains('active')) {
            resetStage('france');
            initializeFranceStage();
        }
    });
}

// 일본 스테이지 초기화
function initializeJapanStage() {
    // 완료 상태 초기화 (다시 플레이 가능하도록)
    japanCompleted = false;
    resetPhase('japan');

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

    // 그림자 이미지 숨기기 (초기화 시)
    updateShadowVisibility();

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

    // 슬롯 아이템 초기 비활성화 상태로 설정 (일본 스테이지만) - 배치된 아이템과 동일한 UI 상태
    // 슬롯 아이템은 slot-menu-japan 안에 있음
    const slotMenuJapan = document.getElementById('slot-menu-japan');
    if (slotMenuJapan) {
        slotMenuJapan.querySelectorAll('.slot-item').forEach(item => {
            item.style.display = 'block';
            // 인라인 스타일 제거하고 CSS 클래스로만 제어
            item.style.removeProperty('opacity');
            item.style.removeProperty('pointer-events');
            item.style.removeProperty('transform');
            item.style.removeProperty('box-shadow');
            item.style.removeProperty('border');
            item.setAttribute('draggable', 'false');
            item.classList.add('disabled');
            item.classList.remove('highlight-pulse'); // 강조 애니메이션 제거

            // CSS 적용 확인을 위한 강제 리플로우
            void item.offsetHeight;
        });
    }

    // 드랍존 하이라이팅 제거
    if (japanStage) {
        japanStage.querySelectorAll('.drop-zone').forEach(zone => {
            zone.classList.remove('highlight-pulse');
        });
    }

    // 드롭 존 크기를 실제 이미지 사이즈에 맞게 조정
    adjustDropZonesToImageSize();

    // 저장된 디버그 위치 적용 (이미지 로드 후 적용되도록 지연)
    setTimeout(() => {
        applyDebugPositions();
        syncShadowPositions();
    }, 200);

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
    resetPhase('china');

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

    // 주전자를 찻잔에 드래그할 때 원형 드랍존 설정
    setupTeapotToCupDropZone();

    // 저장된 디버그 위치 적용 (이미지 로드 후 적용되도록 지연)
    setTimeout(() => {
        applyDebugPositions();
        syncShadowPositions();
    }, 200);

    // 말풍선 초기화 및 시작 메시지 표시
    currentSpeechIndexChina = 0;
    showNextSpeechChina();
}

// 드롭 존 크기를 실제 이미지 사이즈에 맞게 조정하고 위치 설정
function adjustDropZonesToImageSize() {
    const imageMapping = {
        'drop-rice-bowl': 'resource/jp/dish.png',
        'drop-spoon': 'resource/jp/spoon.png',
        'drop-chopsticks': 'resource/jp/chopsticks.png',
        'drop-chopsticks-2': 'resource/jp/chopsticks.png'
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

        img.onload = function () {
            const naturalWidth = this.naturalWidth;
            const naturalHeight = this.naturalHeight;

            // 드롭 존 크기를 이미지 natural size의 80%로 설정 (20% 축소) - vw 단위
            const scaledWidth = naturalWidth * 0.8;
            const scaledHeight = naturalHeight * 0.8;
            dropZone.style.width = `${pxToVw(scaledWidth)}vw`;
            dropZone.style.height = `${pxToVw(scaledHeight)}vw`;

            // 이미지 정보 저장 (스케일된 크기)
            images[dropZoneId] = {
                width: scaledWidth,
                height: scaledHeight
            };

            loadedCount++;

            // 모든 이미지가 로드되면 위치 조정
            if (loadedCount === totalImages) {
                // 먼저 저장된 디버그 위치 적용
                applyDebugPositions();
                // 저장되지 않은 드랍존만 기본 위치 설정
                setTimeout(() => {
                    adjustDropZonePositions(images);
                    syncShadowPositions();
                }, 100);
            }
        };

        img.src = imageSrc;

        // 이미 로드된 경우 즉시 실행
        if (img.complete) {
            const naturalWidth = img.naturalWidth;
            const naturalHeight = img.naturalHeight;
            const scaledWidth = naturalWidth * 0.8;
            const scaledHeight = naturalHeight * 0.8;
            dropZone.style.width = `${pxToVw(scaledWidth)}vw`;
            dropZone.style.height = `${pxToVw(scaledHeight)}vw`;

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
                    syncShadowPositions();
                }, 50);
            }
        }
    });

    // 상단 cheftable 이미지 크기 조정 (20% 축소)
    const topCheftable = document.querySelector('.top-cheftable');
    if (topCheftable) {
        const img = new Image();
        img.onload = function () {
            const naturalWidth = this.naturalWidth;
            const naturalHeight = this.naturalHeight;

            // 상단 cheftable 크기를 이미지 natural size의 75%로 설정 (25% 축소) - vw 단위
            const widthVw = pxToVw(naturalWidth * 0.75);
            const heightVw = pxToVw(naturalHeight * 0.75);
            topCheftable.style.width = `${widthVw}vw`;
            topCheftable.style.height = `${heightVw}vw`;
        };

        img.src = 'resource/jp/cheftable.png';

        // 이미 로드된 경우 즉시 실행
        if (img.complete && img.naturalWidth > 0) {
            const naturalWidth = img.naturalWidth;
            const naturalHeight = img.naturalHeight;
            const widthVw = pxToVw(naturalWidth * 0.75);
            const heightVw = pxToVw(naturalHeight * 0.75);
            topCheftable.style.width = `${widthVw}vw`;
            topCheftable.style.height = `${heightVw}vw`;
        }
    }

    // reciept 이미지 크기 조정 (20% 축소)
    const cardNapkin = document.querySelector('.card-napkin');
    if (cardNapkin) {
        const img = new Image();
        img.onload = function () {
            const naturalWidth = this.naturalWidth;
            const naturalHeight = this.naturalHeight;

            // reciept 크기를 이미지 natural size의 80%로 설정 (20% 축소) - vw 단위
            cardNapkin.style.width = `${pxToVw(naturalWidth * 0.7)}vw`;
            cardNapkin.style.height = `${pxToVw(naturalHeight * 0.7)}vw`;
        };

        img.src = 'reciepts.png';

        // 이미 로드된 경우 즉시 실행
        if (img.complete) {
            const naturalWidth = img.naturalWidth;
            const naturalHeight = img.naturalHeight;
            cardNapkin.style.width = `${pxToVw(naturalWidth * 0.8)}vw`;
            cardNapkin.style.height = `${pxToVw(naturalHeight * 0.8)}vw`;
        }
    }

    // 국그릇 이미지 크기 조정 (20% 축소) - 위치는 CSS에서 고정되어 있음
    const soupBowlImage = document.querySelector('.soup-bowl-image img');
    if (soupBowlImage) {
        const img = new Image();
        img.onload = function () {
            const naturalWidth = this.naturalWidth;
            const naturalHeight = this.naturalHeight;

            // 국그릇 크기를 이미지 natural size의 80%로 설정 (20% 축소) - vw 단위
            soupBowlImage.style.width = `${pxToVw(naturalWidth * 0.8)}vw`;
            soupBowlImage.style.height = `${pxToVw(naturalHeight * 0.8)}vw`;

            // 그림자 이미지 크기도 설정
            syncShadowPositions();
        };

        img.src = 'resource/jp/dish2.png';

        // 이미 로드된 경우 즉시 실행
        if (img.complete) {
            const naturalWidth = img.naturalWidth;
            const naturalHeight = img.naturalHeight;
            soupBowlImage.style.width = `${pxToVw(naturalWidth * 0.8)}vw`;
            soupBowlImage.style.height = `${pxToVw(naturalHeight * 0.8)}vw`;
            syncShadowPositions();
        }
    }

    // 그림자 이미지 초기 크기 설정
    const shadowImages = {
        'resource/jp/dish2_s.png': '.shadow-dish2 img',
        'resource/jp/dish3_s.png': '.shadow-dish3 img',
        'resource/jp/dish4_s.png': '.shadow-dish4 img',
        'resource/jp/dish5_s.png': '.shadow-dish5 img',
        'resource/jp/dish_s.png': '.shadow-dish img',
        'resource/jp/spoon_s.png': '.shadow-spoon img',
        'resource/jp/chopsticks_s.png': '.shadow-chopsticks img'
    };

    Object.keys(shadowImages).forEach(shadowSrc => {
        const selector = shadowImages[shadowSrc];
        const shadowImg = document.querySelector(selector);
        if (shadowImg) {
            const img = new Image();
            img.onload = function () {
                const naturalWidth = this.naturalWidth;
                const naturalHeight = this.naturalHeight;
                // 그림자 이미지 크기를 원본의 80%로 설정
                shadowImg.style.width = `${pxToVw(naturalWidth * 0.8)}vw`;
                shadowImg.style.height = `${pxToVw(naturalHeight * 0.8)}vw`;
                // 위치 동기화
                setTimeout(() => syncShadowPositions(), 50);
            };
            img.src = shadowSrc;

            // 이미 로드된 경우 즉시 실행
            if (img.complete && img.naturalWidth > 0) {
                const naturalWidth = img.naturalWidth;
                const naturalHeight = img.naturalHeight;
                shadowImg.style.width = `${pxToVw(naturalWidth * 0.8)}vw`;
                shadowImg.style.height = `${pxToVw(naturalHeight * 0.8)}vw`;
                setTimeout(() => syncShadowPositions(), 50);
            }
        }
    });
}

// 그림자 이미지 표시/숨김 제어 (드롭존에 아이템이 배치되었을 때만 표시)
function updateShadowVisibility() {
    const japanStage = document.getElementById('japan-stage');
    if (!japanStage) return;

    // 밥그릇 그림자 (drop-rice-bowl에 rice-bowl이 배치되었을 때만 표시)
    const dropRiceBowl = japanStage.querySelector('#drop-rice-bowl');
    const shadowDish = japanStage.querySelector('.shadow-dish');
    if (shadowDish) {
        const hasRiceBowl = dropRiceBowl && dropRiceBowl.querySelector('.dropped-item[data-item-type="rice-bowl"]');
        shadowDish.style.display = hasRiceBowl ? 'block' : 'none';
    }

    // 숟가락 그림자 (drop-spoon에 spoon이 배치되었을 때만 표시)
    const dropSpoon = japanStage.querySelector('#drop-spoon');
    const shadowSpoon = japanStage.querySelector('.shadow-spoon');
    if (shadowSpoon) {
        const hasSpoon = dropSpoon && dropSpoon.querySelector('.dropped-item[data-item-type="spoon"]');
        shadowSpoon.style.display = hasSpoon ? 'block' : 'none';
    }

    // 젓가락 그림자 (drop-chopsticks 또는 drop-chopsticks-2에 chopsticks가 배치되었을 때만 표시)
    const dropChopsticks = japanStage.querySelector('#drop-chopsticks');
    const dropChopsticks2 = japanStage.querySelector('#drop-chopsticks-2');
    const shadowChopsticks = japanStage.querySelector('.shadow-chopsticks');
    if (shadowChopsticks) {
        // 저장된 디버그 위치 확인 (기본값 사용)
        const hasSavedPosition = debugPositions['shadow-chopsticks'];

        const hasChopsticks1 = dropChopsticks && dropChopsticks.querySelector('.dropped-item[data-item-type="chopsticks"]');
        const hasChopsticks2 = dropChopsticks2 && dropChopsticks2.querySelector('.dropped-item[data-item-type="chopsticks"]');
        const hasChopsticks = hasChopsticks1 || hasChopsticks2;

        if (hasChopsticks) {
            shadowChopsticks.style.display = 'block';
            // 저장된 디버그 위치가 있으면 위치 업데이트 건너뛰기 (applyDebugPositions에서 이미 적용됨)
            if (!hasSavedPosition) {
                // 젓가락이 배치된 드롭존의 위치를 따라가도록 설정
                const targetDropZone = hasChopsticks1 ? dropChopsticks : dropChopsticks2;
                if (targetDropZone) {
                    const computed = window.getComputedStyle(targetDropZone);
                    shadowChopsticks.style.left = computed.left;
                    shadowChopsticks.style.top = computed.top;
                    shadowChopsticks.style.width = computed.width;
                    shadowChopsticks.style.height = computed.height;
                    // transform에 오프셋 추가
                    const shadowOffsetX = -3;
                    const shadowOffsetY = 6;
                    const originalTransform = computed.transform;
                    if (originalTransform && originalTransform !== 'none') {
                        shadowChopsticks.style.transform = `${originalTransform} translate(${shadowOffsetX}vw, ${shadowOffsetY}vw)`;
                    } else {
                        shadowChopsticks.style.transform = `translate(${shadowOffsetX}vw, ${shadowOffsetY}vw)`;
                    }
                    // 그림자 이미지 크기도 설정
                    const shadowChopsticksImg = shadowChopsticks.querySelector('img');
                    if (shadowChopsticksImg) {
                        shadowChopsticksImg.style.width = computed.width;
                        shadowChopsticksImg.style.height = computed.height;
                    }
                }
            }
        } else {
            shadowChopsticks.style.display = 'none';
        }
    }
}

// 그림자 이미지 위치를 해당 아이템과 동기화
function syncShadowPositions() {
    const japanStage = document.getElementById('japan-stage');
    if (!japanStage) return;

    // 먼저 그림자 표시/숨김 상태 업데이트 (드롭되었을 때만 표시)
    updateShadowVisibility();

    // 저장된 디버그 위치 확인 (기본값 사용)
    // debugPositions는 loadDebugPositions()에서 defaultDebugPositions로 설정됨

    // 그림자 오프셋 (모든 그림자 이미지에 적용)
    const shadowOffsetX = -3; // vw
    const shadowOffsetY = 6; // vw

    // dish2 그림자 (soup-bowl-image와 동기화)
    const soupBowlImage = japanStage.querySelector('.soup-bowl-image');
    const shadowDish2 = japanStage.querySelector('.shadow-dish2');
    // 저장된 위치가 있으면 동기화 건너뛰기
    if (soupBowlImage && shadowDish2 && !debugPositions['shadow-dish2']) {
        const computed = window.getComputedStyle(soupBowlImage);
        shadowDish2.style.left = computed.left;
        shadowDish2.style.top = computed.top;
        // 기존 transform에 오프셋 추가
        const originalTransform = computed.transform;
        if (originalTransform && originalTransform !== 'none') {
            // transform 값에서 translate 부분을 찾아 오프셋 추가
            shadowDish2.style.transform = `${originalTransform} translate(${shadowOffsetX}vw, ${shadowOffsetY}vw)`;
        } else {
            shadowDish2.style.transform = `translate(${shadowOffsetX}vw, ${shadowOffsetY}vw)`;
        }
        shadowDish2.style.display = 'block'; // 확실히 표시
        // 그림자 이미지 크기도 동기화
        const soupBowlImg = soupBowlImage.querySelector('img');
        const shadowDish2Img = shadowDish2.querySelector('img');
        if (soupBowlImg && shadowDish2Img) {
            const imgComputed = window.getComputedStyle(soupBowlImg);
            const width = imgComputed.width;
            const height = imgComputed.height;
            if (width && width !== '0px' && height && height !== '0px') {
                shadowDish2Img.style.width = width;
                shadowDish2Img.style.height = height;
            }
            shadowDish2Img.style.display = 'block'; // 확실히 표시
        }
    }

    // dish3, 4, 5 그림자 동기화
    ['3', '4', '5'].forEach(num => {
        const dishElement = japanStage.querySelector(`.japan-dish-${num}`);
        const shadowElement = japanStage.querySelector(`.shadow-dish${num}`);
        // 저장된 위치가 있으면 동기화 건너뛰기
        if (dishElement && shadowElement && !debugPositions[`shadow-dish${num}`]) {
            const computed = window.getComputedStyle(dishElement);
            shadowElement.style.left = computed.left;
            shadowElement.style.top = computed.top;
            // 기존 transform에 오프셋 추가
            const originalTransform = computed.transform;
            if (originalTransform && originalTransform !== 'none') {
                shadowElement.style.transform = `${originalTransform} translate(${shadowOffsetX}vw, ${shadowOffsetY}vw)`;
            } else {
                shadowElement.style.transform = `translate(${shadowOffsetX}vw, ${shadowOffsetY}vw)`;
            }
            shadowElement.style.width = computed.width;
            shadowElement.style.height = computed.height;
            shadowElement.style.display = 'block'; // 확실히 표시
            // 그림자 이미지 크기도 동기화
            const dishImg = dishElement.querySelector('img');
            const shadowImg = shadowElement.querySelector('img');
            if (dishImg && shadowImg) {
                const imgComputed = window.getComputedStyle(dishImg);
                const width = imgComputed.width;
                const height = imgComputed.height;
                if (width && width !== '0px' && height && height !== '0px') {
                    shadowImg.style.width = width;
                    shadowImg.style.height = height;
                }
                shadowImg.style.display = 'block'; // 확실히 표시
            }
        }
    });

    // drop-zone 그림자 동기화
    const dropRiceBowl = japanStage.querySelector('#drop-rice-bowl');
    const shadowDish = japanStage.querySelector('.shadow-dish');
    // 저장된 위치가 있으면 동기화 건너뛰기
    if (dropRiceBowl && shadowDish && !debugPositions['shadow-dish']) {
        const computed = window.getComputedStyle(dropRiceBowl);
        shadowDish.style.left = computed.left;
        shadowDish.style.top = computed.top;
        // 기존 transform에 오프셋 추가
        const originalTransform = computed.transform;
        if (originalTransform && originalTransform !== 'none') {
            shadowDish.style.transform = `${originalTransform} translate(${shadowOffsetX}vw, ${shadowOffsetY}vw)`;
        } else {
            shadowDish.style.transform = `translate(${shadowOffsetX}vw, ${shadowOffsetY}vw)`;
        }
        shadowDish.style.width = computed.width;
        shadowDish.style.height = computed.height;
        // display는 updateShadowVisibility()에서 제어
        const shadowDishImg = shadowDish.querySelector('img');
        if (shadowDishImg) {
            shadowDishImg.style.width = computed.width;
            shadowDishImg.style.height = computed.height;
        }
    }

    const dropSpoon = japanStage.querySelector('#drop-spoon');
    const shadowSpoon = japanStage.querySelector('.shadow-spoon');
    // 저장된 위치가 있으면 동기화 건너뛰기
    if (dropSpoon && shadowSpoon && !debugPositions['shadow-spoon']) {
        const computed = window.getComputedStyle(dropSpoon);
        shadowSpoon.style.left = computed.left;
        shadowSpoon.style.top = computed.top;
        // 기존 transform에 오프셋 추가
        const originalTransform = computed.transform;
        if (originalTransform && originalTransform !== 'none') {
            shadowSpoon.style.transform = `${originalTransform} translate(${shadowOffsetX}vw, ${shadowOffsetY}vw)`;
        } else {
            shadowSpoon.style.transform = `translate(${shadowOffsetX}vw, ${shadowOffsetY}vw)`;
        }
        shadowSpoon.style.width = computed.width;
        shadowSpoon.style.height = computed.height;
        // display는 updateShadowVisibility()에서 제어
        const shadowSpoonImg = shadowSpoon.querySelector('img');
        if (shadowSpoonImg) {
            shadowSpoonImg.style.width = computed.width;
            shadowSpoonImg.style.height = computed.height;
        }
    }

    const dropChopsticks = japanStage.querySelector('#drop-chopsticks');
    const dropChopsticks2 = japanStage.querySelector('#drop-chopsticks-2');
    const shadowChopsticks = japanStage.querySelector('.shadow-chopsticks');
    // 저장된 위치가 있으면 동기화 건너뛰기
    // 젓가락 그림자는 updateShadowVisibility에서 위치를 설정하므로 여기서는 건너뜀
    // (updateShadowVisibility가 젓가락이 배치된 드롭존의 위치를 따라가도록 처리)
}

// 드롭 존 위치를 이미지 크기에 맞게 조정하여 겹치지 않게 배치
function adjustDropZonePositions(images) {
    const riceBowl = document.getElementById('drop-rice-bowl');
    const spoon = document.getElementById('drop-spoon');
    const chopsticks = document.getElementById('drop-chopsticks');
    const chopsticks2 = document.getElementById('drop-chopsticks-2');

    if (!riceBowl || !spoon || !chopsticks) return;

    // 저장된 디버그 위치 확인 (기본값 사용)
    // debugPositions는 loadDebugPositions()에서 defaultDebugPositions로 설정됨

    // 밥그릇은 중앙 (이미 CSS로 설정됨)
    const riceBowlWidth = images['drop-rice-bowl'].width;
    const riceBowlHeight = images['drop-rice-bowl'].height;
    const spoonWidth = images['drop-spoon'].width;
    const spoonHeight = images['drop-spoon'].height;
    const chopsticksWidth = images['drop-chopsticks'].width;
    const chopsticksHeight = images['drop-chopsticks'].height;

    // 숟가락: 밥그릇 오른쪽 (더 오른쪽으로 이동하여 젓가락 공간 확보) - vw 단위
    // 저장된 위치가 있으면 기본 위치 설정 건너뛰기
    if (!debugPositions['drop-zone-spoon-japan']) {
        spoon.style.left = '50%';
        spoon.style.top = '60%';
        spoon.style.transform = 'translate(0, -50%)';
        const marginLeftPx = riceBowlWidth / 2 + spoonWidth / 2 + 40; // 간격을 40px로 증가
        spoon.style.marginLeft = `${pxToVw(marginLeftPx)}vw`; // vw 단위로 변환
    } else {
        // 저장된 위치가 있으면 margin 초기화
        spoon.style.marginLeft = '';
    }

    // 젓가락: 50,50에 배치 (회전 제거)
    // 저장된 위치가 있으면 기본 위치 설정 건너뛰기
    if (!debugPositions['drop-zone-chopsticks-japan']) {
        chopsticks.style.left = '50vw';
        chopsticks.style.top = '50vw';
        chopsticks.style.transform = 'none';
        chopsticks.style.transformOrigin = '';
        chopsticks.style.marginTop = '';
        chopsticks.style.marginLeft = '';
    } else {
        // 저장된 위치가 있으면 margin 초기화
        chopsticks.style.marginTop = '';
        chopsticks.style.marginLeft = '';
    }

    // 젓가락 2: 20,20에 배치
    if (chopsticks2) {
        if (!debugPositions['drop-zone-chopsticks-2-japan']) {
            chopsticks2.style.left = '20vw';
            chopsticks2.style.top = '20vw';
            chopsticks2.style.transform = 'none';
            chopsticks2.style.transformOrigin = '';
            chopsticks2.style.marginTop = '';
            chopsticks2.style.marginLeft = '';
            // 크기 설정
            const chopsticksWidth = images['drop-chopsticks-2']?.width || images['drop-chopsticks']?.width || 100;
            const chopsticksHeight = images['drop-chopsticks-2']?.height || images['drop-chopsticks']?.height || 100;
            chopsticks2.style.width = `${pxToVw(chopsticksWidth * 0.8)}vw`;
            chopsticks2.style.height = `${pxToVw(chopsticksHeight * 0.8)}vw`;
        } else {
            // 저장된 위치가 있으면 margin 초기화
            chopsticks2.style.marginTop = '';
            chopsticks2.style.marginLeft = '';
        }
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
        // 5단계(사이드 먹기)부터는 밥그릇에 수저 드롭 이벤트 비활성화
        if (riceBowlDropZone.style.display === 'none' || isSideDishPhase('japan')) {
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
        // 5단계(사이드 먹기)부터는 밥그릇에 수저 드롭 이벤트 비활성화
        if (isSideDishPhase('japan')) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        handleRiceBowlDrop(e, 'stick', leftZone);
    });

    rightZone.addEventListener('drop', (e) => {
        // 5단계(사이드 먹기)부터는 밥그릇에 수저 드롭 이벤트 비활성화
        if (isSideDishPhase('japan')) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        handleRiceBowlDrop(e, 'pick', rightZone);
    });

    riceBowlDropZone.addEventListener('drop', (e) => {
        // 5단계(사이드 먹기)부터는 밥그릇에 수저 드롭 이벤트 비활성화
        if (isSideDishPhase('japan')) {
            return;
        }
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
    // grab4가 표시되면 (riceBowlEatState === 4) 더 이상 드롭 처리 안 함
    // 5단계(사이드 먹기)부터는 밥그릇에 수저 드롭 이벤트 비활성화
    if (riceBowlEatState === 4 || isSideDishPhase('japan')) {
        return;
    }

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

    // 단계 확인: "식사를 시작해볼까요" 단계(UTENSILS_PLACED)인지 확인
    // 이 단계에서는 손으로 밥그릇을 먼저 집어야 하므로 수저 사용을 막아야 함
    const isUtensilsPlacedNow = isUtensilsPlacedPhase('japan');
    const isMealStartNow = isMealStartPhase('japan');

    // 숟가락으로 집기 또는 꽂기를 한 경우
    if (itemType === 'spoon') {
        // 말풍선 표시
        showSpeechBubble('젓가락을 사용하는게 좋아요', 3000);
        // 젓가락 정보 메뉴 표시
        showChopsticksInfoMenu();

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
        return;
    }

    // 젓가락인 경우 기존 로직 유지
    // 꽂기로 드롭한 경우 메시지 표시
    if (action === 'stick') {
        showSpeechBubble('그러면 안 돼요!', 3000);
        showUtensilHoldingInfoMenu();
    } else if (action === 'pick') {
        // "식사를 시작해볼까요" 단계(UTENSILS_PLACED)에서는 진행 막고 info 메뉴 표시
        // 손으로 밥그릇을 먼저 집어야 함
        if (isUtensilsPlacedNow && !isMealStartNow) {
            showSpeechBubble('손으로 그릇을 먼저 집어야 해요', 3000);
            showUtensilHoldingInfoMenu();
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

        // 집기로 드롭한 경우 - grab 이미지 순차적으로 변경
        // grab-image가 있을 때만 (손으로 그릇을 집은 후)
        const grabImage = document.getElementById('grab-image');
        if (grabImage) {
            // 현재 상태 저장
            const currentState = riceBowlEatState;
            updateGrabImage();
            // grab4 이미지가 되면 (riceBowlEatState가 3에서 4로 증가) 완료 메시지가 표시되므로 여기서는 메시지를 표시하지 않음
            if (currentState !== 3) {
                // 집기로 드롭한 경우 메시지 표시하고 아이템은 유지
                showSpeechBubble('잘 드시니 기분이 좋네요', 3000);
            }
        } else {
            // grab-image가 없으면 일반 메시지 표시
            showSpeechBubble('잘 드시니 기분이 좋네요', 3000);
        }
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

// grab 이미지 순차적으로 변경 함수
function updateGrabImage() {
    const grabImage = document.getElementById('grab-image');
    if (!grabImage) return;

    const grabImg = grabImage.querySelector('img');
    if (!grabImg) return;

    // 밥그릇 먹기 상태에 따라 이미지 변경
    const imageStates = [
        'resource/jp/grab.png',      // 0: 초기 상태 (손으로 집은 상태)
        'resource/jp/grab1.png',     // 1: 첫 번째 집기
        'resource/jp/grab2.png',     // 2: 두 번째 집기
        'resource/jp/grab3.png',     // 3: 세 번째 집기
        'resource/jp/grab4.png',     // 4: 네 번째 집기
        'resource/jp/dishFinished.png' // 5: 다 먹은 상태
    ];

    // 상태 증가 (최대 5까지)
    if (riceBowlEatState < 5) {
        riceBowlEatState++;
    }

    // 이미지 변경
    const newImageSrc = imageStates[riceBowlEatState];
    const currentWidth = grabImg.style.width;
    const currentHeight = grabImg.style.height;

    grabImg.src = newImageSrc;

    // 이미지 로드 후 크기 유지
    grabImg.onload = function () {
        if (currentWidth) grabImg.style.width = currentWidth;
        if (currentHeight) grabImg.style.height = currentHeight;

        // grab4 이미지가 되면 (riceBowlEatState === 4) 사이드 먹기 단계로 전환 및 완료 메시지 표시
        if (riceBowlEatState === 4) {
            // 5단계: 사이드 먹기로 전환 (밥그릇 다 비웠을 때)
            setPhase('japan', GAME_PHASE.SIDE_DISH);

            // 사이드 먹기 단계로 전환 시 모든 드롭존 강제로 숨기기
            const riceBowlDropZone = document.getElementById('rice-bowl-drop-zone');
            if (riceBowlDropZone) {
                riceBowlDropZone.style.display = 'none';
            }
            const grabDropZone = document.getElementById('grab-drop-zone');
            if (grabDropZone) {
                grabDropZone.style.display = 'none';
            }

            showCompletionMessage();
        }
    };

    // 이미 로드된 경우
    if (grabImg.complete) {
        if (currentWidth) grabImg.style.width = currentWidth;
        if (currentHeight) grabImg.style.height = currentHeight;

        // grab4 이미지가 되면 (riceBowlEatState === 4) 완료 메시지 표시
        // 사이드 먹기 단계는 "다른 것도 드셔보시겠어요?" 메시지 표시 시점에 전환됨
        if (riceBowlEatState === 4) {
            showCompletionMessage();
        }
    }
}

// 밥그릇 완료 메시지 표시
function showCompletionMessage() {
    // 5단계: 사이드 먹기로 전환 (맛있게 드셔주셔서 감사합니다 시점)
    setPhase('japan', GAME_PHASE.SIDE_DISH);

    // 사이드 먹기 단계로 전환 시 모든 드롭존 강제로 숨기기
    const riceBowlDropZone = document.getElementById('rice-bowl-drop-zone');
    if (riceBowlDropZone) {
        riceBowlDropZone.style.display = 'none';
    }
    const grabDropZone = document.getElementById('grab-drop-zone');
    if (grabDropZone) {
        grabDropZone.style.display = 'none';
    }

    // 사이드 먹기 단계로 전환 시 수저와 밥그릇 드래그 비활성화
    const slotMenuJapan = document.getElementById('slot-menu-japan');
    if (slotMenuJapan) {
        slotMenuJapan.querySelectorAll('.slot-item[data-item="spoon"], .slot-item[data-item="chopsticks"], .slot-item[data-item="rice-bowl"]').forEach(item => {
            item.setAttribute('draggable', 'false');
            item.style.pointerEvents = 'none';
            item.style.opacity = '0.3';
        });
    }

    // 배치된 수저와 밥그릇 아이템도 드래그 비활성화
    document.querySelectorAll('.dropped-item[data-item-type="spoon"], .dropped-item[data-item-type="chopsticks"], .dropped-item[data-item-type="rice-bowl"]').forEach(item => {
        item.setAttribute('draggable', 'false');
        item.style.pointerEvents = 'none';
    });

    // 셰프테이블 밥그릇도 드래그 비활성화
    document.querySelectorAll('.cheftable-rice-bowl').forEach(item => {
        item.setAttribute('draggable', 'false');
        item.style.pointerEvents = 'none';
    });

    // duration을 -1로 설정하여 버튼을 누르기 전까지 자동으로 사라지지 않도록 함
    showSpeechBubble('맛있게 드셔주셔서 감사합니다', -1, false, null, null, null, [
        {
            text: '정말 맛있네요!',
            callback: resetRiceBowlToInitialState
        }
    ]);
}

// 밥그릇을 초기 상태로 리셋 (손으로 집기 전 상태)
// keepPhase: true면 현재 단계를 유지, false면 UTENSILS_PLACED로 되돌림
function resetRiceBowlToInitialState(keepPhase = false) {
    const grabImage = document.getElementById('grab-image');
    const handElement = document.getElementById('hand-draggable');
    const riceBowlDropZone = document.getElementById('drop-rice-bowl');
    const riceBowlItem = riceBowlDropZone ? riceBowlDropZone.querySelector('.dropped-item') : null;
    const handImage = handElement ? handElement.querySelector('img') : null;

    if (!grabImage || !handElement || !riceBowlDropZone) return;

    // 말풍선 숨기기 (단계 유지 시에는 말풍선도 유지)
    if (!keepPhase) {
        hideSpeechBubble();
    }

    // 수저 하이라이트 제거
    stopHighlightUtensils();

    // 손 하이라이트 제거
    if (handElement) {
        handElement.classList.remove('highlight-pulse');
    }

    // 드롭존 하이라이트 제거
    const spoonDropZone = document.getElementById('drop-spoon');
    const chopsticksDropZone = document.getElementById('drop-chopsticks');
    const chopsticksDropZone2 = document.getElementById('drop-chopsticks-2');
    if (spoonDropZone) {
        spoonDropZone.classList.remove('highlight-pulse');
    }
    if (chopsticksDropZone) {
        chopsticksDropZone.classList.remove('highlight-pulse');
    }
    if (chopsticksDropZone2) {
        chopsticksDropZone2.classList.remove('highlight-pulse');
    }

    // grab 이미지에 페이드 아웃 애니메이션 적용 (시간 단축: 0.6s -> 0.3s)
    grabImage.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
    grabImage.style.opacity = '0';
    grabImage.style.transform = 'translate(-50%, -50%) scale(0.9) translateY(20px)';

    // grab 드롭존도 함께 숨기기
    const grabDropZone = document.getElementById('grab-drop-zone');
    if (grabDropZone) {
        grabDropZone.style.display = 'none';
    }

    // 손 위치를 기본 위치로 복원 (CSS 기본값으로)
    if (handElement) {
        handElement.style.left = '';
        handElement.style.top = '';
        handElement.style.bottom = '';
        handElement.style.transition = '';
        if (handImage) {
            handImage.style.transform = '';
        }
    }

    // 애니메이션 완료 후 제거 (시간 단축: 600ms -> 300ms)
    setTimeout(() => {
        grabImage.remove();

        // 손 이미지 다시 표시 (페이드 인 애니메이션, 시간 단축: 0.6s -> 0.3s)
        handElement.style.display = 'block';
        handElement.style.opacity = '0';
        handElement.style.transition = 'opacity 0.3s ease-in';

        // 밥그릇 아이템 다시 표시 (페이드 인 애니메이션, 시간 단축: 0.6s -> 0.3s)
        if (riceBowlItem) {
            // 먹기가 끝났으므로 dishFinished 이미지로 교체
            const riceBowlImg = riceBowlItem.querySelector('img');
            if (riceBowlImg) {
                riceBowlImg.src = 'resource/jp/dishFiinished.png';
                // data-image-src 속성도 업데이트
                riceBowlItem.setAttribute('data-image-src', 'resource/jp/dishFiinished.png');
            }
            riceBowlItem.style.display = 'flex';
            riceBowlItem.style.opacity = '0';
            riceBowlItem.style.transition = 'opacity 0.3s ease-in';
        }

        // 약간의 지연 후 페이드 인 시작
        setTimeout(() => {
            handElement.style.opacity = '1';
            if (riceBowlItem) {
                riceBowlItem.style.opacity = '1';
            }
        }, 50);

        // 애니메이션 완료 후 transition 스타일 제거 (시간 단축: 650ms -> 350ms)
        setTimeout(() => {
            handElement.style.transition = '';
            if (riceBowlItem) {
                riceBowlItem.style.transition = '';
            }
        }, 350);

        // 상태 초기화
        riceBowlEatState = 0;

        // 단계 유지 여부에 따라 처리
        if (!keepPhase) {
            // 단계를 UTENSILS_PLACED로 복원 (식사 시작 전 상태)
            setPhase('japan', GAME_PHASE.UTENSILS_PLACED);

            // "다른 것도 드셔보시겠어요?" 말풍선 표시
            setTimeout(() => {
                showAnotherDishQuestion();
            }, 500);
        }
        // keepPhase가 true면 현재 단계를 유지하고 말풍선도 표시하지 않음
    }, 300);
}

// 슬롯 메뉴에도 드롭 가능하도록 설정
document.querySelector('.slot-menu').addEventListener('dragover', function (e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
});

document.querySelector('.slot-menu').addEventListener('drop', function (e) {
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
    // 5단계(사이드 먹기)부터는 수저와 밥그릇 드래그 자체를 막음
    const checkItemType = this.getAttribute('data-item');
    if ((checkItemType === 'spoon' || checkItemType === 'chopsticks' || checkItemType === 'rice-bowl' || this.classList.contains('cheftable-rice-bowl')) && (isSideDishPhase('japan') || isSideDishPhase('china'))) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        e.dataTransfer.effectAllowed = 'none';
        e.dataTransfer.dropEffect = 'none';
        return false;
    }

    // 비활성화된 슬롯 아이템은 드래그 불가 (배치된 아이템과 동일한 상태 체크)
    if (this.classList.contains('slot-item')) {
        // opacity가 0.3이거나 pointerEvents가 none이거나 draggable이 false이면 비활성화
        const opacity = parseFloat(window.getComputedStyle(this).opacity || '1');
        const pointerEvents = window.getComputedStyle(this).pointerEvents;
        const draggable = this.getAttribute('draggable');

        const isDisabled = this.classList.contains('disabled') ||
            pointerEvents === 'none' ||
            draggable === 'false' ||
            opacity <= 0.3;

        if (isDisabled) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            e.dataTransfer.effectAllowed = 'none';
            e.dataTransfer.dropEffect = 'none';
            if (this.classList.contains('dragging')) {
                this.classList.remove('dragging');
            }
            return false;
        }
    }

    draggedElement = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);

    // slot-item인 경우 드래그 이미지를 실제 드롭될 크기로 설정 (이미지만 드래그되도록)
    if (this.classList.contains('slot-item')) {
        const itemType = this.getAttribute('data-item');
        const imageSrc = this.getAttribute('data-image');

        if (imageSrc) {
            // 실제 이미지 파일 로드하여 natural size 확인
            const img = new Image();
            const createDragImage = (naturalWidth, naturalHeight) => {
                // 드롭될 때의 크기 계산 (placeItemInZone과 동일한 로직)
                const scaleFactor = itemType === 'spoon' ? 0.72 : 0.8;
                const scaledWidthPx = naturalWidth * scaleFactor;
                const scaledHeightPx = naturalHeight * scaleFactor;

                // vw로 변환 후 다시 px로 변환 (드래그 이미지는 px 단위 필요)
                const widthVw = pxToVw(scaledWidthPx);
                const heightVw = pxToVw(scaledHeightPx);
                const widthPx = vwToPx(widthVw);
                const heightPx = vwToPx(heightVw);

                // 임시 이미지 요소 생성
                const dragImage = document.createElement('div');
                dragImage.style.position = 'absolute';
                dragImage.style.top = '-1000px';
                dragImage.style.width = widthPx + 'px';
                dragImage.style.height = heightPx + 'px';
                dragImage.style.backgroundImage = `url('${imageSrc}')`;
                dragImage.style.backgroundSize = 'contain';
                dragImage.style.backgroundPosition = 'center';
                dragImage.style.backgroundRepeat = 'no-repeat';
                document.body.appendChild(dragImage);

                // 드래그 이미지 설정
                e.dataTransfer.setDragImage(dragImage, widthPx / 2, heightPx / 2);

                setTimeout(() => {
                    if (document.body.contains(dragImage)) {
                        document.body.removeChild(dragImage);
                    }
                }, 0);
            };

            img.onload = function () {
                createDragImage(this.naturalWidth, this.naturalHeight);
            };
            img.src = imageSrc;

            // 이미 로드된 경우 즉시 실행
            if (img.complete && img.naturalWidth > 0) {
                createDragImage(img.naturalWidth, img.naturalHeight);
            }
        }
    }

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
        // grab4가 표시되면 (riceBowlEatState === 4) 더 이상 드롭존 표시 안 함
        // 5단계(사이드 먹기)부터는 밥그릇에 수저 드롭 이벤트 비활성화
        if (riceBowlEatState === 4 || isSideDishPhase('japan')) {
            return;
        }

        // 현재 스테이지 확인
        const currentStage = document.getElementById('japan-stage')?.classList.contains('active') ? 'japan' :
            document.getElementById('china-stage')?.classList.contains('active') ? 'china' : 'japan';

        if (currentStage === 'japan') {
            const riceBowlDropZone = document.getElementById('rice-bowl-drop-zone');
            const grabImage = document.getElementById('grab-image');
            // "식사를 시작해볼까요" 단계(UTENSILS_PLACED)에서만 드롭존 표시
            // 손으로 밥그릇을 집을 수 있는 단계
            if (riceBowlDropZone && isUtensilsPlacedPhase('japan') && !isMealStartPhase('japan')) {
                riceBowlDropZone.style.display = 'flex';
                // 손을 먼저 쓰지 않고 수저를 드래그했을 때 메시지 표시
                showSpeechBubble('그릇을 들고 먹는게 좋아요', 3000);
            }
        } else {
            const riceBowlDropZone = document.getElementById('rice-bowl-drop-zone-china');
            // "식사를 시작해볼까요" 단계(UTENSILS_PLACED)에서만 드롭존 표시
            if (riceBowlDropZone && isUtensilsPlacedPhase('china') && !isMealStartPhase('china')) {
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
    // 5단계(사이드 먹기)부터는 수저와 밥그릇 드래그 자체를 막음
    const itemType = this.getAttribute('data-item-type');
    if ((itemType === 'spoon' || itemType === 'chopsticks' || itemType === 'rice-bowl') && (isSideDishPhase('japan') || isSideDishPhase('china'))) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        e.dataTransfer.effectAllowed = 'none';
        e.dataTransfer.dropEffect = 'none';
        return false;
    }

    draggedDroppedItem = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('source', 'dropped');
    e.dataTransfer.setData('item-type', this.getAttribute('data-item-type'));
    e.dataTransfer.setData('image-src', this.getAttribute('data-image-src'));
    e.dataTransfer.setData('drop-zone', this.getAttribute('data-drop-zone'));

    // 숟가락이나 젓가락을 드래그할 때 밥그릇 드롭존 표시 (수저를 다 놓은 후에만, grab 이미지가 없을 때만)
    if (itemType === 'spoon' || itemType === 'chopsticks') {
        // 현재 스테이지 확인
        const currentStage = document.getElementById('japan-stage')?.classList.contains('active') ? 'japan' :
            document.getElementById('china-stage')?.classList.contains('active') ? 'china' : 'japan';

        if (currentStage === 'japan') {
            const riceBowlDropZone = document.getElementById('rice-bowl-drop-zone');
            const grabImage = document.getElementById('grab-image');
            // "식사를 시작해볼까요" 단계(UTENSILS_PLACED)에서만 드롭존 표시
            // 손으로 밥그릇을 집을 수 있는 단계
            if (riceBowlDropZone && isUtensilsPlacedPhase('japan') && !isMealStartPhase('japan')) {
                riceBowlDropZone.style.display = 'flex';
                // 손을 먼저 쓰지 않고 수저를 드래그했을 때 메시지 표시
                showSpeechBubble('그릇을 들고 먹는게 좋아요', 3000);
            }
        } else {
            const riceBowlDropZone = document.getElementById('rice-bowl-drop-zone-china');
            // "식사를 시작해볼까요" 단계(UTENSILS_PLACED)에서만 드롭존 표시
            if (riceBowlDropZone && isUtensilsPlacedPhase('china') && !isMealStartPhase('china')) {
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

    // 비활성화된 드랍존에서는 드롭 막기
    if (this.style.display === 'none' || this.style.pointerEvents === 'none') {
        return false;
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

        // 원래 아이템 제거 (테이블 위의 젓가락인 경우도 포함)
        if (draggedDroppedItem && draggedDroppedItem.parentNode) {
            draggedDroppedItem.remove();
        }

        // 그림자 이미지 표시 업데이트 (원래 위치에서 제거됨)
        updateShadowVisibility();
    } else if (source === 'slot' || source === 'cheftable') {
        // 슬롯 또는 셰프테이블에서 드래그한 경우
        if (!draggedElement) return;

        itemType = draggedElement.getAttribute('data-item');
        imageSrc = draggedElement.getAttribute('data-image');
    } else {
        return false;
    }

    // 5단계(사이드 먹기)부터는 수저 드래그 드랍 이벤트 비활성화
    if ((isSideDishPhase('japan') || isSideDishPhase('china')) && (itemType === 'spoon' || itemType === 'chopsticks')) {
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

    // 그림자 이미지 표시 업데이트 (새 위치에 배치됨)
    updateShadowVisibility();

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

    // 이미지 크기 설정 함수 (드롭 존이 이미지 크기의 80%로 맞춰져 있으므로 80% 사용) - vw 단위
    const setImageSize = function () {
        const naturalWidth = img.naturalWidth;
        const naturalHeight = img.naturalHeight;

        // 숟가락은 원본 크기의 72%로 설정 (80% * 0.9 = 72%), 
        // 찻잔은 120%로 설정 (더 크게), 나머지는 80%로 설정 (20% 축소) - vw 단위
        let scaleFactor = 0.8;
        if (itemType === 'spoon') {
            scaleFactor = 0.72;
        } else if (itemType === 'cup') {
            scaleFactor = 1.2;
        }
        img.style.width = `${pxToVw(naturalWidth * scaleFactor)}vw`;
        img.style.height = `${pxToVw(naturalHeight * scaleFactor)}vw`;
    };

    // 이미지 로드 이벤트 설정
    img.onload = setImageSize;

    // src 설정 (이미 캐시된 경우를 위해 onload 후에도 확인)
    img.src = imageSrc;

    // 이미 로드된 경우 즉시 실행
    if (img.complete) {
        setTimeout(setImageSize, 0);
    }

    // China stage items: add shadow image
    if (itemType === 'cup' || itemType === 'teapot') {
        droppedItem.style.position = 'relative'; // Ensure relative positioning for shadow

        const shadowImg = document.createElement('img');
        shadowImg.className = 'shadow-img';
        shadowImg.src = imageSrc.replace('.png', '_s.png');
        shadowImg.alt = itemType + ' shadow';

        // Shadow styling is handled by CSS (.shadow-img), but we need to ensure it fits
        shadowImg.style.position = 'absolute';
        shadowImg.style.left = '0.5vw';
        shadowImg.style.top = '0.5vw';
        shadowImg.style.width = '100%';
        shadowImg.style.height = '100%';
        shadowImg.style.zIndex = '-1';
        shadowImg.style.transform = 'scale(1.02)';

        droppedItem.appendChild(shadowImg);
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
    droppedItem.addEventListener('click', function (e) {
        // 드래그가 아닌 클릭인 경우에만 실행
        if (!this.classList.contains('dragging')) {
            // 올바른 위치에 놓인 아이템은 클릭해도 인벤토리로 돌아가지 않음
            const dropZone = document.getElementById(dropZoneId);
            if (dropZone && dropZone.classList.contains('correct')) {
                return;
            }
            returnToInventory(this, dropZoneId, itemType);
        }
    });

    dropZone.appendChild(droppedItem);
    dropZone.classList.add('filled');

    // 슬롯에서 아이템 제거 (시각적으로만) - 슬롯에서 온 경우에만
    if (slotElement) {
        // 인라인 스타일 제거하고 CSS 클래스로만 제어
        slotElement.style.opacity = '';
        slotElement.style.pointerEvents = '';
        slotElement.classList.add('disabled');
    }

    // 그림자 이미지 표시 업데이트 (드롭존에 배치되었을 때만 표시)
    updateShadowVisibility();

    // 정답 체크
    // 젓가락의 경우 drop-chopsticks 또는 drop-chopsticks-2 둘 다 올바른 위치
    let isCorrect = false;
    if (itemType === 'chopsticks') {
        isCorrect = dropZoneId === correctZoneId || dropZoneId === 'drop-chopsticks-2';
    } else {
        isCorrect = dropZoneId === correctZoneId;
    }

    if (isCorrect) {
        dropZone.classList.add('correct');
        placedItems[itemType] = dropZoneId;

        // 말풍선에 피드백 표시
        const itemNames = {
            'rice-bowl': '밥그릇',
            'spoon': '숟가락',
            'chopsticks': '젓가락',
            'cup': '찻잔',
            'teapot': '주전자'
        };

        // 현재 스테이지 확인
        const currentStage = document.getElementById('japan-stage')?.classList.contains('active') ? 'japan' :
            document.getElementById('china-stage')?.classList.contains('active') ? 'china' : 'japan';

        // 밥그릇이 올바르게 배치된 경우 특별한 대사 표시 (예외처리: "잘했어요!" 대사 생략)
        if (itemType === 'rice-bowl') {
            // 단계 전환: RICE_BOWL_PLACED
            setPhase(currentStage, GAME_PHASE.RICE_BOWL_PLACED);

            if (currentStage === 'japan') {
                // "잘했어요!" 대사 없이 바로 "수저를 놓아볼까요?" 표시
                // 밥그릇 드롭존은 숨김 (수저를 다 놓을 때까지 표시 안 함)
                const riceBowlDropZone = document.getElementById('rice-bowl-drop-zone');
                if (riceBowlDropZone) {
                    riceBowlDropZone.style.display = 'none';
                }

                // 슬롯 아이템들 활성화 (밥그릇이 배치된 후부터 드래그 가능)
                // 슬롯 아이템은 slot-menu-japan 안에 있음
                const slotMenuJapan = document.getElementById('slot-menu-japan');
                if (slotMenuJapan) {
                    slotMenuJapan.querySelectorAll('.slot-item').forEach(item => {
                        // 인라인 스타일 제거하고 CSS 클래스로만 제어
                        item.style.removeProperty('opacity');
                        item.style.removeProperty('pointer-events');
                        item.setAttribute('draggable', 'true');
                        item.classList.remove('disabled');
                    });
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
            // 찻잔이나 주전자가 올바르게 배치되면 강조 애니메이션 제거
            if (itemType === 'cup' || itemType === 'teapot') {
                if (currentStage === 'china') {
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

            // "잘했어요!" 또는 "좋아!" 메시지 표시 (사이드 먹기 단계에서는 표시하지 않음)
            if (!isSideDishPhase('japan') && !isSideDishPhase('china')) {
                if (currentStage === 'japan') {
                    showSpeechBubble('잘했어요!', 2000);
                } else {
                    // 중국 스테이지: 찻잔과 주전자는 "좋아!", 나머지는 "잘했어요!"
                    const message = (itemType === 'cup' || itemType === 'teapot') ? '좋아!' : '잘했어요!';
                    showSpeechBubbleChina(message, 2000);
                }
            }
        }

        // 모든 아이템이 올바르게 배치되었는지 확인 (딜레이를 주어 메시지가 겹치지 않도록)
        // 사이드 먹기 단계에서는 체크하지 않음
        if (!isSideDishPhase('japan') && !isSideDishPhase('china')) {
            if (currentStage === 'japan') {
                // "잘했어요!" 메시지가 표시된 경우, 그 메시지가 사라진 후에 체크
                if (itemType === 'spoon' || itemType === 'chopsticks') {
                    setTimeout(() => {
                        checkAllCorrect();
                    }, 2500); // "잘했어요!" 메시지(2000ms) + 여유시간(500ms) - 딜레이 반으로 줄임
                } else {
                    checkAllCorrect();
                }
            } else if (currentStage === 'china') {
                // "잘했어요!" 메시지가 표시된 경우, 그 메시지가 사라진 후에 체크
                if (itemType === 'spoon' || itemType === 'chopsticks') {
                    setTimeout(() => {
                        checkAllCorrectChina();
                    }, 2500); // "잘했어요!" 메시지(2000ms) + 여유시간(500ms) - 딜레이 반으로 줄임
                } else {
                    checkAllCorrectChina();
                }
            }
        }
    } else {
        // 잘못된 위치에 배치된 경우 - 아이템은 그대로 두고 말풍선으로 알림
        const itemNames = {
            'rice-bowl': '밥그릇',
            'spoon': '숟가락',
            'chopsticks': '젓가락',
            'cup': '찻잔',
            'teapot': '주전자'
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

    // 그림자 이미지 표시 업데이트
    updateShadowVisibility();

    // 현재 스테이지 확인
    const stage = dropZone.closest('#japan-stage, #china-stage');
    let slotItem = null;

    if (stage) {
        const stageId = stage.id;
        // 스테이지별 슬롯 메뉴 ID 사용
        if (stageId === 'japan-stage') {
            const slotMenu = document.getElementById('slot-menu-japan');
            if (slotMenu) {
                slotItem = slotMenu.querySelector(`.slot-item[data-item="${itemType}"]`);
            }
        } else if (stageId === 'china-stage') {
            const slotMenu = document.getElementById('slot-menu-china');
            if (slotMenu) {
                slotItem = slotMenu.querySelector(`.slot-item[data-item="${itemType}"]`);
            }
        }

        // 슬롯 메뉴를 찾지 못한 경우 스테이지 내에서 직접 찾기
        if (!slotItem) {
            slotItem = stage.querySelector(`.slot-item[data-item="${itemType}"]`);
        }
    } else {
        // 스테이지를 찾을 수 없으면 전체에서 찾기
        slotItem = document.querySelector(`.slot-item[data-item="${itemType}"]`);
    }

    // 슬롯 아이템 다시 활성화
    if (slotItem) {
        // 인라인 스타일 제거하고 CSS 클래스로만 제어
        slotItem.style.opacity = '';
        slotItem.style.pointerEvents = '';
        slotItem.style.display = 'block'; // display도 확실히 설정
        slotItem.classList.remove('disabled');
    }
}

// 모든 아이템이 올바르게 배치되었는지 확인
// (단계 시스템으로 대체됨 - allUtensilsPlaced는 더 이상 사용하지 않음)

function checkAllCorrect() {
    const allItems = Object.keys(correctPositions);
    // 젓가락의 경우 drop-chopsticks 또는 drop-chopsticks-2 둘 다 올바른 위치
    const allCorrect = allItems.every(item => {
        if (item === 'chopsticks') {
            return placedItems[item] === correctPositions[item] || placedItems[item] === 'drop-chopsticks-2';
        }
        return placedItems[item] === correctPositions[item];
    });

    if (allCorrect && Object.keys(placedItems).length === allItems.length && !isUtensilsPlacedPhase('japan')) {
        // 단계 전환: UTENSILS_PLACED
        setPhase('japan', GAME_PHASE.UTENSILS_PLACED);
        japanCompleted = true;
        updateStamp('japan');
        setTimeout(() => {
            // 밥그릇 드롭존은 숨김 상태로 시작 (손 드래그 시 표시됨)
            const riceBowlDropZone = document.getElementById('rice-bowl-drop-zone');
            if (riceBowlDropZone) {
                riceBowlDropZone.style.display = 'none';
            }
            showSpeechBubble('식사를 시작해 볼까요?', 3000);
            highlightHandAndUtensils();
        }, 150); // 딜레이 반으로 줄임 (300ms -> 150ms)
    }
}

function checkAllCorrectChina() {
    const allItems = Object.keys(correctPositionsChina);
    const allCorrect = allItems.every(item => placedItems[item] === correctPositionsChina[item]);

    if (allCorrect && Object.keys(placedItems).length === allItems.length && !isUtensilsPlacedPhase('china')) {
        // 단계 전환: UTENSILS_PLACED
        setPhase('china', GAME_PHASE.UTENSILS_PLACED);
        chinaCompleted = true;
        updateStamp('china');
        setTimeout(() => {
            // 밥그릇 드롭존은 숨김 상태 유지 (수저 드래그 시에만 표시됨)
            const riceBowlDropZone = document.getElementById('rice-bowl-drop-zone-china');
            if (riceBowlDropZone) {
                riceBowlDropZone.style.display = 'none';
            }
            showSpeechBubbleChina('주전자를 찻잔에 기울여!', 3000);
            
            // 기존 드롭존 비활성화 (원형 드랍존 사용을 위해)
            // display는 유지하고 pointer-events만 비활성화하여 드롭된 아이템이 보이도록 함
            const cupDropZone = document.getElementById('drop-zone-cn-cup');
            const teapotDropZone = document.getElementById('drop-zone-cn-teapot');

            if (cupDropZone) {
                cupDropZone.style.pointerEvents = 'none';
                // 드롭존 테두리 숨기기
                cupDropZone.style.border = 'none';
                cupDropZone.style.background = 'transparent';
            }
            if (teapotDropZone) {
                teapotDropZone.style.pointerEvents = 'none';
                // 드롭존 테두리 숨기기
                teapotDropZone.style.border = 'none';
                teapotDropZone.style.background = 'transparent';
            }

            // 주전자를 찻잔에 드래그할 때 원형 드랍존 설정
            setupTeapotToCupDropZone();
            
            highlightHandAndUtensilsChina();
        }, 150); // 딜레이 반으로 줄임 (300ms -> 150ms)
    }
}

function highlightHandAndUtensilsChina() {
    const handElement = document.getElementById('hand-draggable-china');
    const teapotItem = document.querySelector('#china-stage .slot-item[data-item="teapot"]');
    const teapotDropZone = document.getElementById('drop-zone-cn-teapot');

    if (handElement) handElement.classList.add('highlight-pulse');
    if (teapotItem) teapotItem.classList.add('highlight-pulse');
    
    // 드롭된 주전자도 하이라이팅
    if (teapotDropZone && teapotDropZone.classList.contains('filled')) {
        const droppedTeapot = teapotDropZone.querySelector('.dropped-item[data-item-type="teapot"]');
        if (droppedTeapot) {
            droppedTeapot.classList.add('highlight-pulse');
        }
    }
    
    // 주전자 드랍존은 숨김 (원형 드랍존 사용 중)
    // display는 유지하고 pointer-events만 비활성화하여 주전자가 보이도록 함
    if (teapotDropZone) {
        teapotDropZone.style.pointerEvents = 'none';
        teapotDropZone.style.border = 'none';
        teapotDropZone.style.background = 'transparent';
    }
}

// 손, 숟가락, 젓가락 하이라이트
function highlightHandAndUtensils() {
    const handElement = document.getElementById('hand-draggable');
    const spoonItem = document.querySelector('.slot-item[data-item="spoon"]');
    const chopsticksItem = document.querySelector('.slot-item[data-item="chopsticks"]');
    const spoonDropZone = document.getElementById('drop-spoon');
    const chopsticksDropZone = document.getElementById('drop-chopsticks');
    const chopsticksDropZone2 = document.getElementById('drop-chopsticks-2');

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
    if (chopsticksDropZone2) {
        chopsticksDropZone2.classList.add('highlight-pulse');
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
    // 슬롯 메뉴에서 찾기 (우선), 없으면 china-stage에서 찾기
    const cupItem = document.querySelector('#slot-menu-china .slot-item[data-item="cup"]') || document.querySelector('#china-stage .slot-item[data-item="cup"]');
    const teapotItem = document.querySelector('#slot-menu-china .slot-item[data-item="teapot"]') || document.querySelector('#china-stage .slot-item[data-item="teapot"]');

    if (cupItem) {
        // disabled 클래스가 있으면 제거
        cupItem.classList.remove('disabled');
        cupItem.classList.add('highlight-pulse');
    }
    if (teapotItem) {
        // disabled 클래스가 있으면 제거
        teapotItem.classList.remove('disabled');
        teapotItem.classList.add('highlight-pulse');
    }
}

function stopHighlightUtensilsChina() {
    // 슬롯 메뉴에서 찾기 (우선), 없으면 china-stage에서 찾기
    const cupItem = document.querySelector('#slot-menu-china .slot-item[data-item="cup"]') || document.querySelector('#china-stage .slot-item[data-item="cup"]');
    const teapotItem = document.querySelector('#slot-menu-china .slot-item[data-item="teapot"]') || document.querySelector('#china-stage .slot-item[data-item="teapot"]');

    if (cupItem) {
        cupItem.classList.remove('highlight-pulse');
    }
    if (teapotItem) {
        teapotItem.classList.remove('highlight-pulse');
    }
}

// 젓가락 정보 메뉴 표시 함수
function showChopsticksInfoMenu() {
    const infoMenu = document.getElementById('chopsticks-info-menu');
    if (!infoMenu) return;

    // 오른쪽에서 왼쪽으로 등장하는 애니메이션
    infoMenu.style.display = 'block';
    infoMenu.style.top = '300px';
    infoMenu.style.right = '-25vw'; // 초기 위치 (화면 밖 오른쪽)

    // 애니메이션 시작
    setTimeout(() => {
        infoMenu.style.transition = 'right 0.5s ease-out';
        infoMenu.style.right = '20px';
    }, 50);
}

// 젓가락 정보 메뉴 닫기 함수
function closeChopsticksInfoMenu() {
    const infoMenu = document.getElementById('chopsticks-info-menu');
    if (!infoMenu) return;

    // 오른쪽으로 사라지는 애니메이션
    infoMenu.style.transition = 'right 0.5s ease-in';
    infoMenu.style.right = '-25vw';

    // 애니메이션 완료 후 숨김
    setTimeout(() => {
        infoMenu.style.display = 'none';
    }, 500);
}

// 식기 손으로 들고 먹는 것 정보 메뉴 표시 함수
function showUtensilHoldingInfoMenu() {
    const infoMenu = document.getElementById('utensil-holding-info-menu');
    if (!infoMenu) return;

    // 오른쪽에서 왼쪽으로 등장하는 애니메이션
    infoMenu.style.display = 'block';
    infoMenu.style.top = '300px';
    infoMenu.style.right = '-25vw'; // 초기 위치 (화면 밖 오른쪽)

    // 애니메이션 시작
    setTimeout(() => {
        infoMenu.style.transition = 'right 0.5s ease-out';
        infoMenu.style.right = '20px';
    }, 50);
}

// 식기 손으로 들고 먹는 것 정보 메뉴 닫기 함수
function closeUtensilHoldingInfoMenu() {
    const infoMenu = document.getElementById('utensil-holding-info-menu');
    if (!infoMenu) return;

    // 오른쪽으로 사라지는 애니메이션
    infoMenu.style.transition = 'right 0.5s ease-in';
    infoMenu.style.right = '-25vw';

    // 애니메이션 완료 후 숨김
    setTimeout(() => {
        infoMenu.style.display = 'none';
    }, 500);
}

// 전부 먹는게 예의 정보 메뉴 표시 함수
function showEatingEtiquetteInfoMenu() {
    const infoMenu = document.getElementById('eating-etiquette-info-menu');
    if (!infoMenu) return;

    // 오른쪽에서 왼쪽으로 등장하는 애니메이션
    infoMenu.style.display = 'block';
    infoMenu.style.top = '300px';
    infoMenu.style.right = '-25vw'; // 초기 위치 (화면 밖 오른쪽)

    // 애니메이션 시작
    setTimeout(() => {
        infoMenu.style.transition = 'right 0.5s ease-out';
        infoMenu.style.right = '20px';
    }, 50);
}

// 전부 먹는게 예의 정보 메뉴 닫기 함수
function closeEatingEtiquetteInfoMenu() {
    const infoMenu = document.getElementById('eating-etiquette-info-menu');
    if (!infoMenu) return;

    // 오른쪽으로 사라지는 애니메이션
    infoMenu.style.transition = 'right 0.5s ease-in';
    infoMenu.style.right = '-25vw';

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
    const setImageSize = function () {
        const naturalWidth = handImage.naturalWidth;
        const naturalHeight = handImage.naturalHeight;
        const scaledWidth = naturalWidth * 0.8;
        const scaledHeight = naturalHeight * 0.8;
        handImage.style.width = `${pxToVw(scaledWidth)}vw`;
        handImage.style.height = `${pxToVw(scaledHeight)}vw`;
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
        const tableSetting = handElement.closest('.table-setting');
        const tableSettingRect = tableSetting ? tableSetting.getBoundingClientRect() : { left: 0, top: 0 };
        currentX = pxToVw(rect.left - tableSettingRect.left);
        currentY = pxToVw(rect.top - tableSettingRect.top);

        handElement.style.transition = 'none';
        e.preventDefault();
    });

    // 마우스 이동 이벤트
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        // 위치 업데이트 (vw 단위)
        const tableSetting = handElement.closest('.table-setting');
        const tableSettingRect = tableSetting ? tableSetting.getBoundingClientRect() : { left: 0, top: 0 };
        const newX = currentX + pxToVw(deltaX);
        const newY = currentY + pxToVw(deltaY);

        handElement.style.left = `${newX}vw`;
        handElement.style.top = `${newY}vw`;
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
        // "식사를 시작해볼까요" 단계(UTENSILS_PLACED)에서만 상호작용
        // 손으로 밥그릇을 집을 수 있는 단계 (사이드 먹기 단계 제외)
        if (isUtensilsPlacedPhase('japan') && !isMealStartPhase('japan') && !isSideDishPhase('japan')) {
            const dropRiceBowl = document.getElementById('drop-rice-bowl');
            const grabText = document.getElementById('grab-text');

            if (dropRiceBowl && grabText) {
                const handRect = handElement.getBoundingClientRect();
                const riceBowlRect = dropRiceBowl.getBoundingClientRect();

                // 손이 밥그릇 드롭존 안에 있는지 확인
                const isOverRiceBowl = (
                    handRect.left < riceBowlRect.right &&
                    handRect.right > riceBowlRect.left &&
                    handRect.top < riceBowlRect.bottom &&
                    handRect.bottom > riceBowlRect.top
                );

                if (isOverRiceBowl) {
                    // 손을 밥그릇에 댔을 때만 "집기" 텍스트 표시
                    // 꽂기/집기 드롭존은 표시하지 않음
                    dropRiceBowl.style.border = '2px dashed #905431';
                    dropRiceBowl.style.background = 'rgba(245, 243, 229, 0.2)';
                    grabText.style.display = 'block';
                } else {
                    dropRiceBowl.style.border = '';
                    dropRiceBowl.style.background = '';
                    grabText.style.display = 'none';
                }
            }
        }

        // 사이드 먹기 단계에서 손으로 dishFinished를 집기
        if (isSideDishPhase('japan')) {
            const dropRiceBowl = document.getElementById('drop-rice-bowl');
            const grabText = document.getElementById('grab-text');

            if (dropRiceBowl && grabText) {
                const handRect = handElement.getBoundingClientRect();
                const riceBowlRect = dropRiceBowl.getBoundingClientRect();

                // 손이 밥그릇 드롭존 안에 있는지 확인
                const isOverRiceBowl = (
                    handRect.left < riceBowlRect.right &&
                    handRect.right > riceBowlRect.left &&
                    handRect.top < riceBowlRect.bottom &&
                    handRect.bottom > riceBowlRect.top
                );

                if (isOverRiceBowl) {
                    // 손을 밥그릇에 댔을 때만 "집기" 텍스트 표시
                    dropRiceBowl.style.border = '2px dashed #905431';
                    dropRiceBowl.style.background = 'rgba(245, 243, 229, 0.2)';
                    grabText.style.display = 'block';
                } else {
                    dropRiceBowl.style.border = '';
                    dropRiceBowl.style.background = '';
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
            // "식사를 시작해볼까요" 단계(UTENSILS_PLACED)에서만 상호작용
            // 손으로 밥그릇을 집을 수 있는 단계 (사이드 먹기 단계 제외)
            if (isUtensilsPlacedPhase('japan') && !isMealStartPhase('japan') && !isSideDishPhase('japan')) {
                const dropRiceBowl = document.getElementById('drop-rice-bowl');
                const grabText = document.getElementById('grab-text');

                // 손을 밥그릇 위에서 놓았을 때만 grab 이미지로 전환
                if (dropRiceBowl && grabText && grabText.style.display === 'block') {
                    // 손과 밥그릇 이미지를 grab.png로 교체
                    replaceWithGrabImage();
                }
            }

            // 사이드 먹기 단계에서 손으로 dishFinished를 집기
            if (isSideDishPhase('japan')) {
                const dropRiceBowl = document.getElementById('drop-rice-bowl');
                const grabText = document.getElementById('grab-text');

                // 손을 밥그릇 위에서 놓았을 때 grab4 이미지로 전환
                if (dropRiceBowl && grabText && grabText.style.display === 'block') {
                    // 손과 밥그릇 이미지를 grab4.png로 교체
                    replaceWithGrab4Image();
                }
            }

            // 드롭존 스타일 초기화
            const dropRiceBowl = document.getElementById('drop-rice-bowl');
            if (dropRiceBowl) {
                dropRiceBowl.style.border = '';
                dropRiceBowl.style.background = '';
            }
            const grabText = document.getElementById('grab-text');
            if (grabText) {
                grabText.style.display = 'none';
            }

            // "식사를 시작해볼까요" 단계가 아니면 드롭존 숨기기 (사이드 먹기 단계 포함)
            if (!isUtensilsPlacedPhase('japan') || isMealStartPhase('japan') || isSideDishPhase('japan')) {
                const riceBowlDropZone = document.getElementById('rice-bowl-drop-zone');
                if (riceBowlDropZone) {
                    riceBowlDropZone.style.display = 'none';
                }
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
        const tableSetting = handElement.closest('.table-setting');
        const tableSettingRect = tableSetting ? tableSetting.getBoundingClientRect() : { left: 0, top: 0 };
        currentX = pxToVw(rect.left - tableSettingRect.left);
        currentY = pxToVw(rect.top - tableSettingRect.top);

        handElement.style.transition = 'none';
        e.preventDefault();
    });

    document.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        const touch = e.touches[0];

        const deltaX = touch.clientX - startX;
        const deltaY = touch.clientY - startY;

        // 위치 업데이트 (vw 단위)
        const tableSetting = handElement.closest('.table-setting');
        const tableSettingRect = tableSetting ? tableSetting.getBoundingClientRect() : { left: 0, top: 0 };
        const newX = currentX + pxToVw(deltaX);
        const newY = currentY + pxToVw(deltaY);

        handElement.style.left = `${newX}vw`;
        handElement.style.top = `${newY}vw`;
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
        // "식사를 시작해볼까요" 단계(UTENSILS_PLACED)에서만 상호작용
        // 손으로 밥그릇을 집을 수 있는 단계 (사이드 먹기 단계 제외)
        if (isUtensilsPlacedPhase('japan') && !isMealStartPhase('japan') && !isSideDishPhase('japan')) {
            const dropRiceBowl = document.getElementById('drop-rice-bowl');
            const grabText = document.getElementById('grab-text');

            if (dropRiceBowl && grabText) {
                const handRect = handElement.getBoundingClientRect();
                const riceBowlRect = dropRiceBowl.getBoundingClientRect();

                const isOverRiceBowl = (
                    handRect.left < riceBowlRect.right &&
                    handRect.right > riceBowlRect.left &&
                    handRect.top < riceBowlRect.bottom &&
                    handRect.bottom > riceBowlRect.top
                );

                if (isOverRiceBowl) {
                    // 손을 밥그릇에 댔을 때만 "집기" 텍스트 표시
                    // 꽂기/집기 드롭존은 표시하지 않음
                    dropRiceBowl.style.border = '2px dashed #905431';
                    dropRiceBowl.style.background = 'rgba(245, 243, 229, 0.2)';
                    grabText.style.display = 'block';
                } else {
                    dropRiceBowl.style.border = '';
                    dropRiceBowl.style.background = '';
                    grabText.style.display = 'none';
                }
            }
        }

        // 사이드 먹기 단계에서 손으로 dishFinished를 집기
        if (isSideDishPhase('japan')) {
            const dropRiceBowl = document.getElementById('drop-rice-bowl');
            const grabText = document.getElementById('grab-text');

            if (dropRiceBowl && grabText) {
                const handRect = handElement.getBoundingClientRect();
                const riceBowlRect = dropRiceBowl.getBoundingClientRect();

                const isOverRiceBowl = (
                    handRect.left < riceBowlRect.right &&
                    handRect.right > riceBowlRect.left &&
                    handRect.top < riceBowlRect.bottom &&
                    handRect.bottom > riceBowlRect.top
                );

                if (isOverRiceBowl) {
                    // 손을 밥그릇에 댔을 때만 "집기" 텍스트 표시
                    dropRiceBowl.style.border = '2px dashed #905431';
                    dropRiceBowl.style.background = 'rgba(245, 243, 229, 0.2)';
                    grabText.style.display = 'block';
                } else {
                    dropRiceBowl.style.border = '';
                    dropRiceBowl.style.background = '';
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
            // "식사를 시작해볼까요" 단계(UTENSILS_PLACED)에서만 상호작용
            // 손으로 밥그릇을 집을 수 있는 단계 (사이드 먹기 단계 제외)
            if (isUtensilsPlacedPhase('japan') && !isMealStartPhase('japan') && !isSideDishPhase('japan')) {
                const dropRiceBowl = document.getElementById('drop-rice-bowl');
                const grabText = document.getElementById('grab-text');

                // 손을 밥그릇 위에서 놓았을 때만 grab 이미지로 전환
                if (dropRiceBowl && grabText && grabText.style.display === 'block') {
                    // 손과 밥그릇 이미지를 grab.png로 교체
                    replaceWithGrabImage();
                }
            }

            // 사이드 먹기 단계에서 손으로 dishFinished를 집기
            if (isSideDishPhase('japan')) {
                const dropRiceBowl = document.getElementById('drop-rice-bowl');
                const grabText = document.getElementById('grab-text');

                // 손을 밥그릇 위에서 놓았을 때 grab4 이미지로 전환
                if (dropRiceBowl && grabText && grabText.style.display === 'block') {
                    // 손과 밥그릇 이미지를 grab4.png로 교체
                    replaceWithGrab4Image();
                }
            }

            // 드롭존 스타일 초기화
            const dropRiceBowl = document.getElementById('drop-rice-bowl');
            if (dropRiceBowl) {
                dropRiceBowl.style.border = '';
                dropRiceBowl.style.background = '';
            }
            const grabText = document.getElementById('grab-text');
            if (grabText) {
                grabText.style.display = 'none';
            }

            // "식사를 시작해볼까요" 단계가 아니면 드롭존 숨기기 (사이드 먹기 단계 포함)
            if (!isUtensilsPlacedPhase('japan') || isMealStartPhase('japan') || isSideDishPhase('japan')) {
                const riceBowlDropZone = document.getElementById('rice-bowl-drop-zone');
                if (riceBowlDropZone) {
                    riceBowlDropZone.style.display = 'none';
                }
            }
        }
    });
}

// 손과 밥그릇 이미지를 grab.png로 교체
function replaceWithGrabImage() {
    // 단계 전환: MEAL_START
    setPhase('japan', GAME_PHASE.MEAL_START);

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
    grabImg.src = 'resource/jp/grab.png';
    grabImg.alt = 'grab';

    // grab 이미지 생성 시 상태 초기화 (grab.png가 0번 상태)
    riceBowlEatState = 0;

    // 이미지 크기 설정 (90%로 설정)
    grabImg.onload = function () {
        const naturalWidth = this.naturalWidth;
        const naturalHeight = this.naturalHeight;
        // 90% 크기로 설정 - vw 단위
        const scaledWidth = naturalWidth * 0.9;
        const scaledHeight = naturalHeight * 0.9;
        this.style.width = `${pxToVw(scaledWidth)}vw`;
        this.style.height = `${pxToVw(scaledHeight)}vw`;
    };

    if (grabImg.complete) {
        const naturalWidth = grabImg.naturalWidth;
        const naturalHeight = grabImg.naturalHeight;
        const scaledWidth = naturalWidth * 0.9;
        const scaledHeight = naturalHeight * 0.9;
        grabImg.style.width = `${pxToVw(scaledWidth)}vw`;
        grabImg.style.height = `${pxToVw(scaledHeight)}vw`;
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
        // 밥그릇 드롭존의 정확한 위치에 배치 (왼쪽으로 더 이동) - vw 단위
        const leftVw = pxToVw(riceBowlRect.left - tableSettingRect.left + riceBowlRect.width / 2 - 140);
        const topVw = pxToVw(riceBowlRect.top - tableSettingRect.top + riceBowlRect.height / 2);
        grabImageContainer.style.left = `${leftVw}vw`;
        grabImageContainer.style.top = `${topVw}vw`;
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

// 손과 밥그릇 이미지를 grab4.png로 교체 (사이드 먹기 단계용)
function replaceWithGrab4Image() {
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

    // grab4 이미지 새로 생성
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
    grabImg.src = 'resource/jp/grab4.png'; // grab4 이미지 사용
    grabImg.alt = 'grab4';

    // grab4 이미지 생성 시 상태를 4로 설정
    riceBowlEatState = 4;

    // 이미지 크기 설정 (90%로 설정)
    grabImg.onload = function () {
        const naturalWidth = this.naturalWidth;
        const naturalHeight = this.naturalHeight;
        // 90% 크기로 설정 - vw 단위
        const scaledWidth = naturalWidth * 0.9;
        const scaledHeight = naturalHeight * 0.9;
        this.style.width = `${pxToVw(scaledWidth)}vw`;
        this.style.height = `${pxToVw(scaledHeight)}vw`;
    };

    if (grabImg.complete) {
        const naturalWidth = grabImg.naturalWidth;
        const naturalHeight = grabImg.naturalHeight;
        const scaledWidth = naturalWidth * 0.9;
        const scaledHeight = naturalHeight * 0.9;
        grabImg.style.width = `${pxToVw(scaledWidth)}vw`;
        grabImg.style.height = `${pxToVw(scaledHeight)}vw`;
    }

    grabImageContainer.appendChild(grabImg);

    // grab4 이미지에 호버 효과 및 클릭 이벤트 추가
    grabImageContainer.style.pointerEvents = 'auto';
    grabImageContainer.style.cursor = 'pointer';
    grabImageContainer.classList.add('grab4-hoverable');

    // 호버 효과 (수저 호버 효과와 동일: opacity 0.7)
    grabImageContainer.addEventListener('mouseenter', function () {
        grabImg.style.opacity = '0.7';
        grabImg.style.transition = 'opacity 0.2s ease-out';
    });

    grabImageContainer.addEventListener('mouseleave', function () {
        grabImg.style.opacity = '1';
    });

    // 클릭 이벤트: 밥그릇과 손을 제자리로 돌아가게 (단계는 유지)
    grabImageContainer.addEventListener('click', function () {
        resetRiceBowlToInitialState(true); // true = 단계 유지
    });

    // 터치 이벤트도 지원
    grabImageContainer.addEventListener('touchend', function (e) {
        e.preventDefault();
        resetRiceBowlToInitialState(true); // true = 단계 유지
    });

    tableSetting.appendChild(grabImageContainer);

    // 위치 설정 (밥그릇 드롭존 위치에 정확히 배치)
    const riceBowlRect = riceBowlDropZone ? riceBowlDropZone.getBoundingClientRect() : null;
    const tableSettingRect = tableSetting.getBoundingClientRect();

    if (riceBowlRect) {
        // 밥그릇 드롭존의 정확한 위치에 배치 (왼쪽으로 더 이동) - vw 단위
        const leftVw = pxToVw(riceBowlRect.left - tableSettingRect.left + riceBowlRect.width / 2 - 140);
        const topVw = pxToVw(riceBowlRect.top - tableSettingRect.top + riceBowlRect.height / 2);
        grabImageContainer.style.left = `${leftVw}vw`;
        grabImageContainer.style.top = `${topVw}vw`;
        grabImageContainer.style.transform = 'translate(-50%, -50%)';
    } else {
        // 밥그릇 위치를 찾을 수 없으면 중앙에 배치
        grabImageContainer.style.left = '50%';
        grabImageContainer.style.top = '55%';
        grabImageContainer.style.transform = 'translate(-50%, -50%)';
    }
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
        // grab4가 표시되면 (riceBowlEatState === 4) 더 이상 드롭존 표시 안 함
        // 5단계(사이드 먹기)부터는 밥그릇에 수저 드롭 이벤트 비활성화
        if (riceBowlEatState === 4 || isSideDishPhase('japan')) {
            return;
        }

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
        // 5단계(사이드 먹기)부터는 밥그릇에 수저 드롭 이벤트 비활성화
        if (isSideDishPhase('japan')) {
            return;
        }

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
        // 5단계(사이드 먹기)부터는 밥그릇에 수저 드롭 이벤트 비활성화
        if (isSideDishPhase('japan')) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        handleGrabDrop(e, 'stick', leftZone);
    });

    rightZone.addEventListener('drop', (e) => {
        // 5단계(사이드 먹기)부터는 밥그릇에 수저 드롭 이벤트 비활성화
        if (isSideDishPhase('japan')) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        handleGrabDrop(e, 'pick', rightZone);
    });

    grabDropZone.addEventListener('drop', (e) => {
        // 5단계(사이드 먹기)부터는 밥그릇에 수저 드롭 이벤트 비활성화
        if (isSideDishPhase('japan')) {
            return;
        }
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
    // grab4가 표시되면 (riceBowlEatState === 4) 더 이상 드롭 처리 안 함
    // 5단계(사이드 먹기)부터는 밥그릇에 수저 드롭 이벤트 비활성화
    if (riceBowlEatState === 4 || isSideDishPhase('japan')) {
        return;
    }

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

    // 단계 확인: "식사를 시작해볼까요" 단계(UTENSILS_PLACED)인지 확인
    // 이 단계에서는 손으로 밥그릇을 먼저 집어야 하므로 수저 사용을 막아야 함
    const isUtensilsPlacedNow = isUtensilsPlacedPhase('japan');
    const isMealStartNow = isMealStartPhase('japan');

    // 숟가락을 꽂기로 드롭한 경우도 메시지 표시
    if (itemType === 'spoon' && action === 'stick') {
        showSpeechBubble('그러면 안 돼요!', 3000);
        showUtensilHoldingInfoMenu();
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
        // "식사를 시작해볼까요" 단계(UTENSILS_PLACED)에서는 진행 막고 info 메뉴 표시
        // 손으로 밥그릇을 먼저 집어야 함
        if (isUtensilsPlacedNow && !isMealStartNow) {
            showSpeechBubble('손으로 그릇을 먼저 집어야 해요', 3000);
            showUtensilHoldingInfoMenu();
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

        // 숟가락으로 집기 또는 꽂기를 한 경우
        if (itemType === 'spoon') {
            // 말풍선 표시
            showSpeechBubble('젓가락을 사용하는게 좋아요', 3000);
            // 젓가락 정보 메뉴 표시
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
            // 아이템은 사라지지 않도록 여기서 종료
            return;
        }

        // 젓가락으로 집기일 때만 grab 이미지 순차적으로 변경
        if (itemType === 'chopsticks') {
            // 현재 상태 저장
            const currentState = riceBowlEatState;
            updateGrabImage();
            // grab4 이미지가 되면 (riceBowlEatState가 3에서 4로 증가) 완료 메시지가 표시되므로 여기서는 메시지를 표시하지 않음
            if (currentState !== 3) {
                // 집기로 드롭한 경우 메시지 표시하고 아이템은 유지
                showSpeechBubble('잘 드시니 기분이 좋네요', 3000);
            }
        } else {
            // 젓가락이 아니면 일반 메시지 표시
            showSpeechBubble('잘 드시니 기분이 좋네요', 3000);
        }
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
        img2.src = 'resource/cn/cn_table2.png';

        const adjustSize2 = function () {
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

            chinaTableImage2.style.width = `${pxToVw(width)}vw`;
            chinaTableImage2.style.height = `${pxToVw(height)}vw`;
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
        img1.src = 'resource/cn/cn_table1.png';

        const adjustSize1 = function () {
            const naturalWidth = img1.naturalWidth;
            const naturalHeight = img1.naturalHeight;

            if (naturalWidth === 0 || naturalHeight === 0) return;

            // 원본 크기의 40%로 설정
            const width = naturalWidth * 0.4;
            const height = naturalHeight * 0.4;

            chinaTableImage1.style.width = `${pxToVw(width)}vw`;
            chinaTableImage1.style.height = `${pxToVw(height)}vw`;
        };

        img1.onload = adjustSize1;

        if (img1.complete && img1.naturalWidth > 0) {
            adjustSize1();
        }
    }

    // 중국 식기 이미지들 크기 조정 (원본 크기의 80%)
    const utensilImages = [
        { selector: '.cn-spoon img', src: 'resource/cn/cn_spoon.png' },
        { selector: '.cn-chopstick img', src: 'resource/cn/cn_chopstick.png' },
        { selector: '.cn-rice img', src: 'resource/cn/cn_rice.png' },
        { selector: '.cn-dish img', src: 'resource/cn/cn_dish.png' }
    ];

    utensilImages.forEach(({ selector, src }) => {
        const utensilImg = document.querySelector(`#china-stage ${selector}`);
        if (utensilImg) {
            const img = new Image();
            img.src = src;

            const adjustSize = function () {
                const naturalWidth = img.naturalWidth;
                const naturalHeight = img.naturalHeight;

                if (naturalWidth === 0 || naturalHeight === 0) return;

                // 원본 크기의 80%로 설정
                const width = naturalWidth * 0.8;
                const height = naturalHeight * 0.8;

                utensilImg.style.width = `${pxToVw(width)}vw`;
                utensilImg.style.height = `${pxToVw(height)}vw`;
            };

            img.onload = adjustSize;

            if (img.complete && img.naturalWidth > 0) {
                adjustSize();
            }
        }
    });

    // 중국 젓가락 드래그 기능 초기화
    initializeChinaChopsticksDrag();

    // 중국 메인 숟가락 드래그 기능 초기화
    initializeChinaMainspoonDrag();

    // 중국 국자 드래그 기능 초기화
    initializeChinaSoupspoonDrag();
}

// 중국 젓가락 드래그 기능 초기화
function initializeChinaChopsticksDrag() {
    const chopsticks = [
        document.querySelector('.cn-chopstick'),
        document.querySelector('.cn-chopstick2')
    ];

    chopsticks.forEach(chopstick => {
        if (!chopstick) return;

        // HTML5 드래그 앤 드롭 사용
        chopstick.setAttribute('draggable', 'true');

        // 데이터 속성 설정 (handleDrop에서 사용)
        chopstick.setAttribute('data-item-type', 'chopsticks');
        // 이미지 소스는 내부 이미지 태그에서 가져오기 (그림자 제외)
        const img = chopstick.querySelector('img:not(.shadow-img)');
        if (img) {
            chopstick.setAttribute('data-image-src', img.getAttribute('src'));
        }

        chopstick.addEventListener('dragstart', (e) => {
            draggedDroppedItem = chopstick; // 전역 변수 설정

            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('source', 'dropped');
            e.dataTransfer.setData('item-type', 'chopsticks');
            if (img) {
                e.dataTransfer.setData('image-src', img.getAttribute('src'));
            }

            // 드래그 이미지 설정
            if (img) {
                const rect = chopstick.getBoundingClientRect();
                const computedStyle = window.getComputedStyle(chopstick);
                const width = parseFloat(computedStyle.width);
                const height = parseFloat(computedStyle.height);

                // 회전값 가져오기
                const transform = computedStyle.transform;

                const dragImgContainer = document.createElement('div');
                dragImgContainer.style.position = 'absolute';
                dragImgContainer.style.top = '-1000px';
                dragImgContainer.style.left = '-1000px';
                dragImgContainer.style.width = width + 'px';
                dragImgContainer.style.height = height + 'px';
                dragImgContainer.style.transform = transform;
                dragImgContainer.style.transformOrigin = 'center';

                const dragImg = img.cloneNode(true);
                dragImg.style.width = '100%';
                dragImg.style.height = '100%';
                dragImg.style.objectFit = 'contain';

                dragImgContainer.appendChild(dragImg);
                document.body.appendChild(dragImgContainer);

                // 클릭한 위치와 요소의 중심점 사이의 오프셋 계산
                // setDragImage의 좌표는 이미지의 좌상단 기준
                // boundingClientRect를 사용하여 실제 보이는 위치 기준의 오프셋 계산
                const offsetX = e.clientX - rect.left;
                const offsetY = e.clientY - rect.top;

                e.dataTransfer.setDragImage(dragImgContainer, offsetX, offsetY);

                setTimeout(() => {
                    if (document.body.contains(dragImgContainer)) {
                        document.body.removeChild(dragImgContainer);
                    }
                }, 0);
            }

            chopstick.classList.add('dragging');

            // cn-soupspoon 임시로 숨기기 (볶음밥 단계에서만, 드롭존 방해 방지)
            const dropZone = document.getElementById('dish2-drop-zone');
            if (dropZone && dropZone.style.display === 'flex') {
                const soupspoon = document.querySelector('.cn-soupspoon');
                if (soupspoon) {
                    soupspoon.style.opacity = '0';
                    soupspoon.style.pointerEvents = 'none';
                }
            }
        });

        chopstick.addEventListener('dragend', (e) => {
            chopstick.classList.remove('dragging');

            // cn-soupspoon 다시 보이기
            const soupspoon = document.querySelector('.cn-soupspoon');
            if (soupspoon) {
                soupspoon.style.opacity = '';
                soupspoon.style.pointerEvents = '';
            }

            // 기존 handleDroppedItemDragEnd 호출
            if (typeof handleDroppedItemDragEnd === 'function') {
                handleDroppedItemDragEnd(e);
            }
        });
    });
}

// 중국 메인 숟가락 드래그 기능 초기화
function initializeChinaMainspoonDrag() {
    const mainspoon = document.querySelector('.cn-mainspoon');
    if (!mainspoon) return;

    // 초기에는 비활성화 (볶음밥 단계에서 활성화됨)
    mainspoon.setAttribute('draggable', 'false');
    mainspoon.style.cursor = 'default';

    // 데이터 속성 설정
    mainspoon.setAttribute('data-item-type', 'mainspoon');
    const img = mainspoon.querySelector('img');
    if (img) {
        mainspoon.setAttribute('data-image-src', img.getAttribute('src'));
    }

    mainspoon.addEventListener('dragstart', (e) => {
        draggedDroppedItem = mainspoon; // 전역 변수 설정

        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('source', 'dropped');
        e.dataTransfer.setData('item-type', 'mainspoon');
        if (img) {
            e.dataTransfer.setData('image-src', img.getAttribute('src'));
        }

        // 드래그 이미지 설정
        if (img) {
            const rect = mainspoon.getBoundingClientRect();
            const computedStyle = window.getComputedStyle(mainspoon);
            const width = parseFloat(computedStyle.width);
            const height = parseFloat(computedStyle.height);

            const dragImgContainer = document.createElement('div');
            dragImgContainer.style.position = 'absolute';
            dragImgContainer.style.top = '-1000px';
            dragImgContainer.style.left = '-1000px';
            dragImgContainer.style.width = width + 'px';
            dragImgContainer.style.height = height + 'px';

            const dragImg = img.cloneNode(true);
            dragImg.style.width = '100%';
            dragImg.style.height = '100%';
            dragImg.style.objectFit = 'contain';

            dragImgContainer.appendChild(dragImg);
            document.body.appendChild(dragImgContainer);

            const offsetX = e.clientX - rect.left;
            const offsetY = e.clientY - rect.top;

            e.dataTransfer.setDragImage(dragImgContainer, offsetX, offsetY);

            setTimeout(() => {
                if (document.body.contains(dragImgContainer)) {
                    document.body.removeChild(dragImgContainer);
                }
            }, 0);
        }

        mainspoon.classList.add('dragging');

        // cn-soupspoon 임시로 숨기기 (드롭존 방해 방지)
        const soupspoon = document.querySelector('.cn-soupspoon');
        if (soupspoon) {
            soupspoon.style.opacity = '0';
            soupspoon.style.pointerEvents = 'none';
        }

        // cn_dish2에 드롭존 생성 및 표시
        const dish2 = document.querySelector('.cn-dish2');
        if (dish2) {
            let dropZone = document.getElementById('dish2-drop-zone');
            if (!dropZone) {
                dropZone = document.createElement('div');
                dropZone.id = 'dish2-drop-zone';
                dropZone.className = 'drop-zone circular-drop-zone';

                // 드래그 오버 이벤트
                dropZone.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    dropZone.classList.add('drag-over');

                    // 드래그 중인 아이템에 따라 텍스트 변경
                    if (draggedDroppedItem) {
                        if (draggedDroppedItem.classList.contains('cn-chopstick') ||
                            draggedDroppedItem.classList.contains('cn-chopstick2')) {
                            dropZone.textContent = '집기'; // 젓가락
                        } else if (draggedDroppedItem.classList.contains('cn-mainspoon')) {
                            dropZone.textContent = '담기'; // 메인스푼
                        }
                    }

                    dropZone.style.display = 'flex';
                    dropZone.style.justifyContent = 'center';
                    dropZone.style.alignItems = 'center';
                    dropZone.style.color = 'white';
                    dropZone.style.fontSize = '1.5vw';
                    dropZone.style.fontWeight = 'bold';
                    dropZone.style.textShadow = '0 0 5px black';
                });

                // 드래그 리브 이벤트
                dropZone.addEventListener('dragleave', (e) => {
                    dropZone.classList.remove('drag-over');
                    dropZone.textContent = '';
                });

                // 드롭 이벤트
                dropZone.addEventListener('drop', (e) => {
                    e.preventDefault();
                    dropZone.classList.remove('drag-over');
                    dropZone.textContent = '';

                    // mainspoon을 드롭한 경우
                    if (draggedDroppedItem && draggedDroppedItem.classList.contains('cn-mainspoon')) {
                        // cn_dish2 이미지를 cn_dish2_a.png로 변경
                        const dish2Img = dish2.querySelector('img:not(.shadow-img)');
                        if (dish2Img) {
                            dish2Img.src = 'resource/cn/cn_dish2_a.png';
                        }


                        // 드롭존 숨기기
                        dropZone.style.display = 'none';

                        // 말풍선 표시: "볶음밥 먹는 법은 알지?"
                        setTimeout(() => {
                            showSpeechBubbleChina('볶음밥 먹는 법은 알지?', 999999);

                            // table1 하이라이트 제거
                            const table1 = document.querySelector('.cn-table1');
                            if (table1) {
                                table1.classList.remove('highlight-blink');
                            }

                            // mainspoon 하이라이트 중지 및 드래그 비활성화
                            const mainspoon = document.querySelector('.cn-mainspoon');
                            if (mainspoon) {
                                mainspoon.classList.remove('highlight-scale');
                                mainspoon.setAttribute('draggable', 'false');
                                mainspoon.style.cursor = 'default';
                                // opacity는 그대로 유지
                            }

                            // maindish5 드롭존 제거
                            const maindish5DropZone = document.getElementById('maindish5-fake-drop-zone');
                            if (maindish5DropZone) {
                                maindish5DropZone.remove();
                            }

                            // dish2 드롭존 다시 표시 (젓가락용)
                            dropZone.style.display = 'flex';
                            dropZone.textContent = '담기';

                            // 젓가락 두 개 하이라이트
                            const chopstick1 = document.querySelector('.cn-chopstick');
                            const chopstick2 = document.querySelector('.cn-chopstick2');
                            if (chopstick1) {
                                chopstick1.classList.add('highlight-item');
                            }
                            if (chopstick2) {
                                chopstick2.classList.add('highlight-item');
                            }

                            // cn-soupspoon 하이라이트 (위치 유지)
                            const soupspoon = document.querySelector('.cn-soupspoon');
                            if (soupspoon) {
                                soupspoon.classList.add('highlight-item');
                            }
                        }, 100);
                    }
                    // 개인 젓가락(cn_chopstick)을 드롭한 경우 - 정답
                    else if (draggedDroppedItem && draggedDroppedItem.classList.contains('cn-chopstick')) {
                        console.log('개인 젓가락을 dish2에 드롭했습니다 - 정답');

                        // 드롭존 숨기기
                        dropZone.style.display = 'none';

                        // 젓가락과 국자 하이라이트 제거
                        const chopstick1 = document.querySelector('.cn-chopstick');
                        const chopstick2 = document.querySelector('.cn-chopstick2');
                        const soupspoon = document.querySelector('.cn-soupspoon');
                        if (chopstick1) {
                            chopstick1.classList.remove('highlight-item');
                        }
                        if (chopstick2) {
                            chopstick2.classList.remove('highlight-item');
                        }
                        if (soupspoon) {
                            soupspoon.classList.remove('highlight-item');
                        }

                        // 말풍선 표시 - 버튼 클릭형
                        setTimeout(() => {
                            showSpeechBubbleChina('여기 볶음밥이 상해에서 제일 유명해!', 999999, true, () => {
                                // 버튼 클릭 시 "더 먹을거지?" 표시 및 선택 버튼 표시
                                // 타이밍 충돌 방지를 위해 딜레이 추가
                                setTimeout(() => {
                                    const onStartCallback = () => {
                                        setTimeout(() => {
                                            expandSpeechBubbleForLeftoversSelectionChina();
                                        }, 100);
                                    };

                                    showSpeechBubbleChina('더 먹을거지?', -1, false, null, onStartCallback, null, null);
                                }, 200);
                            }, null, '그럴만하다');
                        }, 100);
                    }
                    // 공용 젓가락(cn_chopstick2)을 드롭한 경우 - 오답
                    else if (draggedDroppedItem && draggedDroppedItem.classList.contains('cn-chopstick2')) {
                        console.log('공용 젓가락을 dish2에 드롭했습니다 - 오답');

                        // 인포 메뉴 표시
                        const infoMenu = document.getElementById('info-menu-china');
                        const infoTitle = document.getElementById('info-title-china');
                        const infoDesc = document.getElementById('info-desc-china');

                        if (infoMenu && infoTitle && infoDesc) {
                            infoTitle.textContent = '개인 식기 사용';
                            infoDesc.innerHTML = '내 앞에 있는 음식은<br>개인 식기로 먹어야 합니다.<br>공용 젓가락이 아닌<br>개인 젓가락을 사용하세요.';
                            infoMenu.style.display = 'block';
                            infoMenu.style.top = '300px';
                            infoMenu.style.right = '-25vw';
                            setTimeout(() => {
                                infoMenu.style.transition = 'right 0.5s ease-out';
                                infoMenu.style.right = '20px';
                            }, 50);

                            // 7초 후 자동으로 닫기
                            setTimeout(() => {
                                infoMenu.style.transition = 'right 0.5s ease-in';
                                infoMenu.style.right = '-25vw';
                                setTimeout(() => {
                                    infoMenu.style.display = 'none';
                                }, 500);
                            }, 7000);
                        }

                        // 말풍선 표시 - 타이밍 충돌 방지를 위해 딜레이 추가
                        setTimeout(() => {
                            showSpeechBubbleChina('공용 젓가락이 아니라 개인 젓가락으로 먹어야지!', 3000);
                        }, 100);

                        // 드롭존 유지 (다시 시도 가능)
                    }
                });

                dish2.appendChild(dropZone);
            }
            dropZone.style.display = 'flex';
            dropZone.textContent = '담기';
        }
    });

    mainspoon.addEventListener('dragend', (e) => {
        mainspoon.classList.remove('dragging');

        // cn_dish2 드롭존 숨기기 (드롭하지 않고 끝난 경우)
        const dropZone = document.getElementById('dish2-drop-zone');
        if (dropZone) {
            dropZone.style.display = 'none';
        }

        // cn-soupspoon 다시 보이기
        const soupspoon = document.querySelector('.cn-soupspoon');
        if (soupspoon) {
            soupspoon.style.opacity = '';
            soupspoon.style.pointerEvents = '';
        }

        // 기존 handleDroppedItemDragEnd 호출
        if (typeof handleDroppedItemDragEnd === 'function') {
            handleDroppedItemDragEnd(e);
        }
    });
}

// 중국 국자 클릭 기능 초기화
function initializeChinaSoupspoonDrag() {
    const soupspoon = document.querySelector('.cn-soupspoon');
    if (!soupspoon) return;

    // 드래그 불가능 설정 (클릭만 사용)
    soupspoon.setAttribute('draggable', 'false');

    // 데이터 속성 설정 (기존 유지)
    soupspoon.setAttribute('data-item-type', 'soupspoon');
    const img = soupspoon.querySelector('img');
    if (img) {
        soupspoon.setAttribute('data-image-src', img.getAttribute('src'));
    }
    // 클릭 시작 이벤트 추가 (mousedown으로 즉시 활성화)
    soupspoon.addEventListener('mousedown', () => {
        // 볶음밥 단계에서만 실행 (dish2 드롭존이 표시되어 있을 때)
        const dropZone = document.getElementById('dish2-drop-zone');
        if (!dropZone || dropZone.style.display !== 'flex') {
            return; // 볶음밥 단계가 아니면 아무것도 하지 않음
        }

        console.log('국자를 클릭했습니다 - 에러 표시');

        // 인포 메뉴 표시
        const infoMenu = document.getElementById('info-menu-china');
        const infoTitle = document.getElementById('info-title-china');
        const infoDesc = document.getElementById('info-desc-china');

        if (infoMenu && infoTitle && infoDesc) {
            infoTitle.textContent = '숟가락 사용 금지';
            infoDesc.innerHTML = '중국에서는 밥을 먹을 때<br>숟가락을 사용하지 않습니다.<br>젓가락으로 먹어야 합니다.';
            infoMenu.style.display = 'block';
            infoMenu.style.top = '300px';
            infoMenu.style.right = '-25vw';
            setTimeout(() => {
                infoMenu.style.transition = 'right 0.5s ease-out';
                infoMenu.style.right = '20px';
            }, 50);
        }

        // 말풍선 표시
        showSpeechBubbleChina('숟가락으로 볶음밥을 먹는다고?', 3000);
    });
}

// 공용 젓가락 정보 메뉴 표시 함수
function showPublicChopsticksInfoMenuChina() {
    const infoMenu = document.getElementById('info-menu-china');
    const infoTitle = document.getElementById('info-title-china');
    const infoDesc = document.getElementById('info-desc-china');

    if (infoMenu && infoTitle && infoDesc) {
        infoTitle.textContent = '공용 젓가락 사용';
        infoDesc.innerHTML = '중국에서는 음식을 덜어먹을 때<br>개인 젓가락이 아닌<br>공용 젓가락(긴 젓가락)을 사용해야 합니다.';
        infoMenu.classList.add('show');
    }
}

// 남김없이 먹기/조금 남기기 선택을 위한 말풍선 확장 (중국 스테이지)
function expandSpeechBubbleForLeftoversSelectionChina() {
    const speechBubble = document.getElementById('speech-bubble-china');
    const speechBubbleContent = speechBubble ? speechBubble.querySelector('.speech-bubble-content') : null;
    const nextBtn = document.getElementById('next-speech-btn-china');

    if (!speechBubble || !speechBubbleContent) return;

    // 기존 버튼 숨기기
    if (nextBtn) {
        nextBtn.style.display = 'none';
    }

    // 기존 선택 버튼 컨테이너가 있으면 제거
    const existingSelectionContainer = speechBubbleContent.querySelector('.leftovers-selection-buttons');
    if (existingSelectionContainer) {
        existingSelectionContainer.remove();
    }

    // 말풍선 세로로 더 넓게, 가로로도 더 넓게 확장
    speechBubbleContent.style.transition = 'min-height 0.5s ease-in-out, max-width 0.5s ease-in-out, padding 0.5s ease-in-out';
    speechBubbleContent.style.minHeight = '480px';
    speechBubbleContent.style.maxWidth = '1280px';
    speechBubbleContent.style.padding = '40px 40px 120px 40px';

    // 좌우로 배치된 버튼 컨테이너 생성
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'leftovers-selection-buttons';
    buttonsContainer.style.display = 'flex';
    buttonsContainer.style.flexDirection = 'row';
    buttonsContainer.style.justifyContent = 'space-between';
    buttonsContainer.style.gap = '40px';
    buttonsContainer.style.marginTop = '40px';
    buttonsContainer.style.width = '100%';
    buttonsContainer.style.position = 'relative';
    buttonsContainer.style.zIndex = '10011';

    // 좌측 버튼: 남김없이 먹기
    const leftButton = document.createElement('button');
    leftButton.className = 'next-btn';
    leftButton.style.flex = '1';
    leftButton.style.margin = '0';
    leftButton.style.minWidth = '280px';
    leftButton.style.minHeight = '320px';
    leftButton.style.display = 'flex';
    leftButton.style.flexDirection = 'column';
    leftButton.style.alignItems = 'center';
    leftButton.style.justifyContent = 'center';
    leftButton.style.gap = '16px';
    leftButton.style.padding = '24px';
    leftButton.style.position = 'relative';
    leftButton.style.zIndex = '10012';

    // 이미지 컨테이너
    const leftImageContainer = document.createElement('div');
    leftImageContainer.style.width = '200px';
    leftImageContainer.style.height = '200px';
    leftImageContainer.style.backgroundColor = 'transparent';
    leftImageContainer.style.display = 'flex';
    leftImageContainer.style.alignItems = 'center';
    leftImageContainer.style.justifyContent = 'center';
    leftButton.appendChild(leftImageContainer);

    // 텍스트
    const leftText = document.createElement('span');
    leftText.textContent = '남김없이 먹기';
    leftText.style.fontSize = '19px';
    leftText.style.whiteSpace = 'nowrap';
    leftButton.appendChild(leftText);

    leftButton.onclick = () => {
        handleLeftoversSelectionChina('empty');
    };
    buttonsContainer.appendChild(leftButton);

    // 우측 버튼: 조금 남기기
    const rightButton = document.createElement('button');
    rightButton.className = 'next-btn';
    rightButton.style.flex = '1';
    rightButton.style.margin = '0';
    rightButton.style.minWidth = '280px';
    rightButton.style.minHeight = '320px';
    rightButton.style.display = 'flex';
    rightButton.style.flexDirection = 'column';
    rightButton.style.alignItems = 'center';
    rightButton.style.justifyContent = 'center';
    rightButton.style.gap = '16px';
    rightButton.style.padding = '24px';
    rightButton.style.position = 'relative';
    rightButton.style.zIndex = '10012';

    // 이미지 컨테이너
    const rightImageContainer = document.createElement('div');
    rightImageContainer.style.width = '200px';
    rightImageContainer.style.height = '200px';
    rightImageContainer.style.backgroundColor = 'transparent';
    rightImageContainer.style.display = 'flex';
    rightImageContainer.style.alignItems = 'center';
    rightImageContainer.style.justifyContent = 'center';
    rightButton.appendChild(rightImageContainer);

    // 텍스트
    const rightText = document.createElement('span');
    rightText.textContent = '조금 남기기';
    rightText.style.fontSize = '19px';
    rightText.style.whiteSpace = 'nowrap';
    rightButton.appendChild(rightText);

    rightButton.onclick = () => {
        handleLeftoversSelectionChina('leave');
    };
    buttonsContainer.appendChild(rightButton);

    // 버튼 컨테이너를 말풍선 안에 추가
    speechBubbleContent.appendChild(buttonsContainer);
}

// 말풍선을 기본 스타일로 되돌리기 (중국 스테이지)
function resetSpeechBubbleToDefaultChina() {
    const speechBubble = document.getElementById('speech-bubble-china');
    const speechBubbleContent = speechBubble ? speechBubble.querySelector('.speech-bubble-content') : null;
    const nextBtn = document.getElementById('next-speech-btn-china');

    if (!speechBubble || !speechBubbleContent) return;

    // 확장된 버튼 컨테이너 제거
    const existingSelectionContainer = speechBubbleContent.querySelectorAll('.leftovers-selection-buttons, .calculation-selection-buttons');
    existingSelectionContainer.forEach(container => container.remove());

    // 말풍선 스타일을 기본값으로 되돌리기
    speechBubbleContent.style.transition = 'min-height 0.5s ease-in-out, max-width 0.5s ease-in-out, padding 0.5s ease-in-out';
    speechBubbleContent.style.minHeight = '';
    speechBubbleContent.style.maxWidth = '';
    speechBubbleContent.style.padding = '';

    // 다음 버튼 다시 표시
    if (nextBtn) {
        nextBtn.style.display = 'block';
    }
}

// 남김없이 먹기/조금 남기기 선택 처리 (중국 스테이지)
function handleLeftoversSelectionChina(choice) {
    if (choice === 'empty') {
        // 남김없이 먹기 - 오답 (중국은 조금 남겨야 함)
        console.log('남김없이 먹기 선택 - 중국 (오답)');

        // 기존 말풍선을 기본 스타일로 되돌리기
        resetSpeechBubbleToDefaultChina();
        
        // 새로운 말풍선 표시: "음식이 모자랐어...?"
        // 다시하기 버튼 클릭 시 이전 말풍선으로 돌아가기
        showSpeechBubbleChina('음식이 모자랐어...?', -1, true, () => {
            // 다시하기 버튼 클릭 시 이전 말풍선으로 돌아가기
            showSpeechBubbleChina('더 먹을거지?', -1, false, null, () => {
                setTimeout(() => {
                    expandSpeechBubbleForLeftoversSelectionChina();
                }, 100);
            }, null, null);
        }, null, '다시하기', null);
        
        // 인포 메뉴 표시
        const infoMenu = document.getElementById('info-menu-china');
        const infoTitle = document.getElementById('info-title-china');
        const infoDesc = document.getElementById('info-desc-china');
        
        if (infoMenu && infoTitle && infoDesc) {
            infoTitle.textContent = '식사 예절';
            infoDesc.innerHTML = '중국에서는 음식을 남기면 부족했다는 뜻으로<br>여겨져서 실례가 됩니다.<br><br>음식을 남기면 주인이 충분히 대접하지 못했다는<br>의미로 받아들여질 수 있습니다.<br><br>따라서 중국에서는 음식을 조금 남기는 것이<br>올바른 예절입니다.';
            infoMenu.style.display = 'flex';
            infoMenu.style.top = '300px';
            infoMenu.style.right = '-25vw';
            setTimeout(() => {
                infoMenu.style.transition = 'right 0.5s ease-out';
                infoMenu.style.right = '20px';
            }, 50);
            
            // 7초 후 자동으로 닫기
            setTimeout(() => {
                infoMenu.style.transition = 'right 0.5s ease-in';
                infoMenu.style.right = '-25vw';
                setTimeout(() => {
                    infoMenu.style.display = 'none';
                }, 500); // 애니메이션 완료 후 숨김
            }, 7000);
        }
        
        return; // 여기서 종료하여 아래 코드 실행 방지
    }

    // 조금 남기기 선택 시에만 말풍선을 기본 스타일로 되돌리기
    resetSpeechBubbleToDefaultChina();

    // 공통: 인포 메뉴 표시
    const infoMenu = document.getElementById('info-menu-china');
    const infoTitle = document.getElementById('info-title-china');
    const infoDesc = document.getElementById('info-desc-china');

    if (infoMenu && infoTitle && infoDesc) {
        infoTitle.textContent = '식사 예절';
        infoDesc.innerHTML = '중국에서는 음식을 조금 남기는 것이<br>올바른 예절입니다.<br><br>음식을 조금 남기면 주인이 충분히<br>대접했다는 의미로 받아들입니다.<br><br>반대로 음식을 전부 다 먹으면<br>더 달라는 신호로 여겨질 수 있습니다.';
        infoMenu.style.display = 'block';
        infoMenu.style.top = '300px';
        infoMenu.style.right = '-25vw';
        setTimeout(() => {
            infoMenu.style.transition = 'right 0.5s ease-out';
            infoMenu.style.right = '20px';
        }, 50);

        // 7초 후 자동으로 닫기
        setTimeout(() => {
            infoMenu.style.transition = 'right 0.5s ease-in';
            infoMenu.style.right = '-25vw';
            setTimeout(() => {
                infoMenu.style.display = 'none';
            }, 500); // 애니메이션 완료 후 숨김
        }, 7000);
    }

    if (choice === 'leave') {
        // 조금 남기기 - 정답 (중국 문화)
        console.log('조금 남기기 선택 - 중국 (정답)');

        // 모든 maindish 이미지를 _f 버전으로 변경 (조금 남긴 상태)
        const maindishes = document.querySelectorAll('[class^="cn-maindish"]');
        maindishes.forEach(dish => {
            const img = dish.querySelector('img:not(.shadow-img)');
            if (img) {
                const currentSrc = img.getAttribute('src');
                // .png를 _f.png로 변경
                const newSrc = currentSrc.replace('.png', '_f.png');
                img.setAttribute('src', newSrc);
            }
        });

        // 정답 처리 - 버튼을 통한 진행
        showSpeechBubbleChina('맛있게 먹어줘서 고마워.', 999999, true, () => {
            // "나야말로" 버튼 클릭 시 다음 말풍선
            showSpeechBubbleChina('이제 차를 마실 시간이야.', 999999);

            // 차 마시기 단계 시작: 열려있는 모든 인포 메뉴 닫기 (애니메이션 적용)
            const allInfoMenus = document.querySelectorAll('.info-menu');
            allInfoMenus.forEach(menu => {
                // 슬라이드 아웃 애니메이션
                menu.style.transition = 'right 0.5s ease-out';
                menu.style.right = '-250px';

                // 애니메이션 완료 후 완전히 숨김
                setTimeout(() => {
                    menu.style.display = 'none';
                }, 500);
            });
            // 차 마시기 단계 시작: 인벤토리의 차와 주전자 활성화
            const cupItem = document.querySelector('#slot-menu-china .slot-item[data-item="cup"]') || document.querySelector('#china-stage .slot-item[data-item="cup"]');
            const teapotItem = document.querySelector('#slot-menu-china .slot-item[data-item="teapot"]') || document.querySelector('#china-stage .slot-item[data-item="teapot"]');

            if (cupItem) {
                cupItem.classList.remove('disabled');
                cupItem.setAttribute('draggable', 'true');
            }
            if (teapotItem) {
                teapotItem.classList.remove('disabled');
                teapotItem.setAttribute('draggable', 'true');
            }
            
            // 찻잔과 주전자 하이라이팅 (일본 스테이지 수저 하이라이팅과 동일한 스타일)
            // disabled 클래스를 제거한 후에 하이라이팅 추가
            highlightUtensilsChina();

            // 드롭존 활성화 (보이도록 설정)
            const cupDropZone = document.getElementById('drop-zone-cn-cup');
            const teapotDropZone = document.getElementById('drop-zone-cn-teapot');

            if (cupDropZone) {
                cupDropZone.style.display = 'block';
                cupDropZone.style.opacity = '1';
                // 찻잔 드랍존은 하이라이팅하지 않음
            }
            if (teapotDropZone) {
                teapotDropZone.style.display = 'block';
                teapotDropZone.style.opacity = '1';
                // 하이라이팅 효과 추가 (커졌다 작아졌다) - 주전자만
                teapotDropZone.classList.add('highlight-scale');
            }
        }, null, '나야말로');
    }
}

// 중국 테이블 이미지 1 드래그 회전 기능
function initializeChinaTable1Rotation() {
    // .china-table-image-1 또는 .cn-table1 둘 다 찾기
    const chinaTable1 = document.querySelector('#china-stage .china-table-image-1') ||
        document.querySelector('#china-stage .cn-table1');
    const chinaTable1Img = chinaTable1 ? chinaTable1.querySelector('img') : null;

    if (!chinaTable1 || !chinaTable1Img) return;

    let isDragging = false;
    let startAngle = 0;
    let currentRotation = 0;
    let startX = 0;
    let startY = 0;
    let rotationAtStart = 0; // 드래그 시작 시 회전 각도
    let enableTableRotationCheck = false; // 회전 체크 활성화 여부 (초기값: false)
    let tableRotationEnabled = false; // 테이블 회전 기능 활성화 여부 (초기값: false)
    
    // 전역 변수도 초기화
    window.enableTableRotationCheckGlobal = false;
    
    // 초기에는 테이블 회전 비활성화
    chinaTable1.style.pointerEvents = 'none';
    chinaTable1.style.cursor = 'default';
    
    // 테이블 회전 활성화 함수 (외부에서 호출 가능하도록)
    // 클로저를 사용하여 로컬 변수에 접근
    const enableTableRotation = () => {
        tableRotationEnabled = true;
        chinaTable1.style.pointerEvents = 'auto';
        chinaTable1.style.cursor = 'grab';
    };
    
    // 전역 함수로 등록
    window.enableChinaTableRotation = enableTableRotation;
    
    // enableTableRotationCheck를 설정하는 전역 함수
    window.setEnableTableRotationCheck = (value) => {
        enableTableRotationCheck = value;
    };

    // 초기 회전 각도 저장
    const getCurrentRotation = () => {
        const transform = chinaTable1.style.transform || '';
        const match = transform.match(/rotate\(([^)]+)\)/);
        if (match) {
            return parseFloat(match[1]) || 0;
        }
        return 0;
    };

    // maindish 이미지들의 회전 각도 업데이트 함수
    const updateMaindishRotations = (rotation) => {
        const maindishes = chinaTable1.querySelectorAll('.cn-maindish1, .cn-maindish2, .cn-maindish3, .cn-maindish4, .cn-maindish5, .cn-maindish6');
        maindishes.forEach(maindish => {
            // 이미지 회전 (mainspoon 제외)
            const images = maindish.querySelectorAll('img:not(.cn-mainspoon img)');
            images.forEach(img => {
                // mainspoon 내부의 이미지는 건너뛰기
                if (img.closest('.cn-mainspoon')) return;

                if (img.classList.contains('shadow-img')) {
                    img.style.transform = `scale(1.02) rotate(${-rotation}deg)`;
                } else {
                    img.style.transform = `rotate(${-rotation}deg)`;
                }
            });

            // 드롭존 텍스트 회전 (항상 정방향 유지)
            const dropZones = maindish.querySelectorAll('.drop-zone');
            dropZones.forEach(zone => {
                let transform = '';
                if (zone.classList.contains('circular-drop-zone')) {
                    transform = `translate(-50%, -50%) rotate(${-rotation}deg)`;
                } else {
                    transform = `rotate(${-rotation}deg)`;
                }

                zone.style.transform = transform;
            });

            // mainspoon 회전 (컨테이너와 이미지 모두 정방향 유지)
            const mainspoon = maindish.querySelector('.cn-mainspoon');
            if (mainspoon) {
                mainspoon.style.transform = `translate(-50%, -50%) rotate(${-rotation}deg)`;
                // mainspoon 내부 img도 명시적으로 정방향 유지
                const mainspoonImg = mainspoon.querySelector('img');
                if (mainspoonImg) {
                    mainspoonImg.style.transform = 'rotate(0deg)';
                }
            }
        });
    };

    // 초기 회전 각도 적용
    const initialRotation = getCurrentRotation();
    updateMaindishRotations(initialRotation);

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
                                        // 회전 체크 비활성화 (더 이상 말풍선/메뉴 안 뜨게)
                                        enableTableRotationCheck = false;

                                        // 버튼 숨기기
                                        nextBtn.style.display = 'none';

                                        // 다음 대사 표시
                                        showSpeechBubbleChina('이제 너도 먹어볼래? 저기 만두 말야');

                                        // table1 하이라이트 (하얀색 그림자 깜빡임)
                                        const table1 = document.querySelector('.cn-table1');
                                        if (table1) {
                                            table1.classList.add('highlight-blink');
                                        }

                                        // 젓가락 하이라이트 (크기 커졌다 작아졌다)
                                        const chopstick1 = document.querySelector('.cn-chopstick');
                                        const chopstick2 = document.querySelector('.cn-chopstick2');
                                        if (chopstick1) chopstick1.classList.add('highlight-scale');
                                        if (chopstick2) chopstick2.classList.add('highlight-scale');

                                        // cn_maindish4에 원형 드롭존 표시
                                        const maindish4 = document.querySelector('.cn-maindish4');
                                        if (maindish4) {
                                            let dropZone = document.getElementById('mandu-drop-zone');
                                            if (!dropZone) {
                                                dropZone = document.createElement('div');
                                                dropZone.id = 'mandu-drop-zone';
                                                dropZone.className = 'drop-zone circular-drop-zone highlight-scale-centered';

                                                // 드래그 오버 이벤트: "집기" 텍스트 표시
                                                dropZone.addEventListener('dragover', (e) => {
                                                    e.preventDefault();
                                                    e.dataTransfer.dropEffect = 'move';
                                                    if (!dropZone.classList.contains('drag-over')) {
                                                        dropZone.classList.add('drag-over');
                                                        updateMaindishRotations(currentRotation);
                                                    }
                                                    dropZone.textContent = '집기';
                                                    dropZone.style.display = 'flex';
                                                    dropZone.style.justifyContent = 'center';
                                                    dropZone.style.alignItems = 'center';
                                                    dropZone.style.color = 'white';
                                                    dropZone.style.fontSize = '1.5vw';
                                                    dropZone.style.fontWeight = 'bold';
                                                    dropZone.style.textShadow = '0 0 5px black';
                                                });

                                                // 드래그 리브 이벤트: 텍스트 제거
                                                dropZone.addEventListener('dragleave', (e) => {
                                                    if (dropZone.classList.contains('drag-over')) {
                                                        dropZone.classList.remove('drag-over');
                                                        updateMaindishRotations(currentRotation);
                                                    }
                                                    dropZone.textContent = '';
                                                });

                                                // 드롭 이벤트
                                                dropZone.addEventListener('drop', (e) => {
                                                    e.preventDefault();
                                                    dropZone.classList.remove('drag-over');
                                                    updateMaindishRotations(currentRotation);
                                                    dropZone.textContent = '';

                                                    if (draggedDroppedItem) {
                                                        // 짧은 젓가락(개인용)을 사용한 경우
                                                        if (draggedDroppedItem.classList.contains('cn-chopstick')) {
                                                            showSpeechBubbleChina('긴 젓가락을 써야 해!');
                                                            showPublicChopsticksInfoMenuChina();
                                                        }
                                                        // 긴 젓가락(공용)을 사용한 경우
                                                        else if (draggedDroppedItem.classList.contains('cn-chopstick2')) {
                                                            // 정답 처리
                                                            console.log('Correct chopsticks used');

                                                            // 1. cn_maindish4 이미지 변경
                                                            const maindish4Img = maindish4.querySelector('img:not(.shadow-img)');
                                                            if (maindish4Img) {
                                                                maindish4Img.src = 'resource/cn/cn_maindish4_1.png';
                                                            }

                                                            // 2. 접시(cn-dish) 위에 만두(mandu.png) 나타나기
                                                            const dish = document.querySelector('.cn-dish');
                                                            if (dish) {
                                                                // 만두 그림자 추가
                                                                const manduShadowImg = document.createElement('img');
                                                                manduShadowImg.src = 'resource/cn/mandu_s.png';
                                                                manduShadowImg.className = 'mandu-shadow';
                                                                dish.appendChild(manduShadowImg);

                                                                // 만두 추가
                                                                const manduImg = document.createElement('img');
                                                                manduImg.src = 'resource/cn/mandu.png';
                                                                manduImg.className = 'mandu-on-dish';
                                                                dish.appendChild(manduImg);

                                                                // 접시 위 드롭존 추가
                                                                const dishDropZone = document.createElement('div');
                                                                dishDropZone.className = 'drop-zone circular-drop-zone highlight-scale-centered';
                                                                dishDropZone.id = 'dish-drop-zone';
                                                                dishDropZone.style.display = 'block';

                                                                // 드래그 오버 이벤트
                                                                dishDropZone.addEventListener('dragover', (e) => {
                                                                    e.preventDefault();
                                                                    e.dataTransfer.dropEffect = 'move';
                                                                    dishDropZone.classList.add('drag-over');
                                                                    dishDropZone.textContent = '집기';
                                                                    dishDropZone.style.display = 'flex';
                                                                    dishDropZone.style.justifyContent = 'center';
                                                                    dishDropZone.style.alignItems = 'center';
                                                                    dishDropZone.style.color = 'white';
                                                                    dishDropZone.style.fontSize = '1.5vw';
                                                                    dishDropZone.style.fontWeight = 'bold';
                                                                    dishDropZone.style.textShadow = '0 0 5px black';
                                                                });

                                                                // 드래그 리브 이벤트
                                                                dishDropZone.addEventListener('dragleave', (e) => {
                                                                    dishDropZone.classList.remove('drag-over');
                                                                    dishDropZone.textContent = '';
                                                                });

                                                                // 드롭 이벤트
                                                                dishDropZone.addEventListener('drop', (e) => {
                                                                    e.preventDefault();
                                                                    dishDropZone.classList.remove('drag-over');
                                                                    dishDropZone.textContent = '';

                                                                    // 젓가락을 드래그한 경우 처리
                                                                    if (draggedDroppedItem) {
                                                                        // cn-chopstick2 (긴 공용 젓가락)을 사용한 경우 - 오류
                                                                        if (draggedDroppedItem.classList.contains('cn-chopstick2')) {
                                                                            // 인포 메뉴 표시
                                                                            const infoMenu = document.getElementById('info-menu-china');
                                                                            const infoTitle = document.getElementById('info-title-china');
                                                                            const infoDesc = document.getElementById('info-desc-china');

                                                                            if (infoMenu && infoTitle && infoDesc) {
                                                                                infoTitle.textContent = '개인 젓가락 사용';
                                                                                infoDesc.innerHTML = '음식을 덜 때가 아닌<br>먹을 때는<br>개인 젓가락을 사용해야 합니다.';
                                                                                infoMenu.style.display = 'block';
                                                                                infoMenu.style.top = '300px';
                                                                                infoMenu.style.right = '-25vw';
                                                                                setTimeout(() => {
                                                                                    infoMenu.style.transition = 'right 0.5s ease-out';
                                                                                    infoMenu.style.right = '20px';
                                                                                }, 50);
                                                                            }

                                                                            // 말풍선 표시
                                                                            showSpeechBubbleChina('음식을 먹을 때는 개인 젓가락을 사용해야 해!', 3000);
                                                                        }
                                                                        // cn-chopstick (짧은 개인 젓가락)을 사용한 경우 - 정답, 진행
                                                                        else if (draggedDroppedItem.classList.contains('cn-chopstick')) {
                                                                            // 드롭존 제거
                                                                            dishDropZone.remove();

                                                                            // 만두 이미지 찾기
                                                                            const dish = document.querySelector('.cn-dish');
                                                                            const manduImg = dish ? dish.querySelector('.mandu-on-dish') : null;

                                                                            if (manduImg) {
                                                                                // CSS 애니메이션 제거 (충돌 방지)
                                                                                manduImg.style.animation = 'none';
                                                                                
                                                                                // 현재 transform 값 가져오기 (CSS의 translate(-50%, -50%) 유지)
                                                                                const currentTransform = window.getComputedStyle(manduImg).transform;
                                                                                
                                                                                // 1단계: mandu.png -> mandu2.png (먹는 중) - 자연스러운 전환
                                                                                // 페이드 아웃 애니메이션
                                                                                manduImg.style.transition = 'opacity 0.4s ease-in-out, transform 0.4s ease-in-out';
                                                                                manduImg.style.opacity = '0';
                                                                                // CSS의 translate(-50%, -50%)를 유지하면서 scale과 translateY 추가
                                                                                manduImg.style.transform = 'translate(-50%, -50%) scale(0.9) translateY(5px)';

                                                                                setTimeout(() => {
                                                                                    // 이미지 변경
                                                                                    manduImg.src = 'resource/cn/mandu2.png';
                                                                                    
                                                                                    // 이미지 로드 대기
                                                                                    const newImg = new Image();
                                                                                    newImg.src = 'resource/cn/mandu2.png';
                                                                                    newImg.onload = () => {
                                                                                        // 페이드 인 애니메이션 (더 자연스러운 효과)
                                                                                        manduImg.style.transition = 'opacity 0.5s ease-out, transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                                                                                    manduImg.style.opacity = '1';
                                                                                        // CSS의 translate(-50%, -50%)를 유지하면서 scale과 translateY 추가
                                                                                        manduImg.style.transform = 'translate(-50%, -50%) scale(1.08) translateY(-3px)'; // 살짝 위로 올라가며 커짐

                                                                                        // 원래 크기와 위치로 복귀
                                                                                    setTimeout(() => {
                                                                                            manduImg.style.transition = 'transform 0.3s ease-out';
                                                                                            manduImg.style.transform = 'translate(-50%, -50%) scale(1) translateY(0)';
                                                                                        }, 500);
                                                                                    };

                                                                                    // 2단계: 짧은 시간 후 만두 사라짐 (다 먹음)
                                                                                    setTimeout(() => {
                                                                                        manduImg.style.transition = 'opacity 0.4s ease-out';
                                                                                        manduImg.style.opacity = '0';
                                                                                        // 크기 변화 없이 페이드 아웃만

                                                                                        // 만두 그림자도 함께 사라짐
                                                                                        const manduShadow = dish.querySelector('.mandu-shadow');
                                                                                        if (manduShadow) {
                                                                                            manduShadow.style.transition = 'opacity 0.4s ease-out';
                                                                                            manduShadow.style.opacity = '0';
                                                                                        }

                                                                                        // 애니메이션 완료 후 요소 제거
                                                                                        setTimeout(() => {
                                                                                            manduImg.remove();
                                                                                            if (manduShadow) manduShadow.remove();

                                                                                            // 성공 메시지 - 질문 형식 (다른 이벤트 완료를 위한 짧은 딜레이)
                                                                                            setTimeout(() => {
                                                                                                let buttonClicked = false;

                                                                                                // 5초 후 자동으로 다음 단계로 진행 (말풍선이 사라진 경우 대비)
                                                                                                const fallbackTimer = setTimeout(() => {
                                                                                                    if (!buttonClicked) {
                                                                                                        console.log('Fallback: 자동으로 다음 단계로 진행');
                                                                                                        // 버튼 클릭과 동일한 로직 실행
                                                                                                        proceedToFriedRiceStep();
                                                                                                    }
                                                                                                }, 1000);

                                                                                                // 볶음밥 단계로 진행하는 함수
                                                                                                const proceedToFriedRiceStep = () => {
                                                                                                    // 버튼 클릭 시 다음 메시지
                                                                                                    showSpeechBubbleChina('볶음밥도 맛있어, 얼른 먹어 봐', 999999);

                                                                                                    // 테이블 하이라이트 (흰색 그림자 깜빡임)
                                                                                                    const table1 = document.querySelector('.cn-table1');
                                                                                                    if (table1) {
                                                                                                        table1.classList.add('highlight-blink');
                                                                                                    }

                                                                                                    // mainspoon 활성화 및 하이라이트 (크기 커졌다 작아졌다)
                                                                                                    const mainspoon = document.querySelector('.cn-mainspoon');
                                                                                                    if (mainspoon) {
                                                                                                        mainspoon.setAttribute('draggable', 'true');
                                                                                                        mainspoon.style.cursor = 'grab';
                                                                                                        mainspoon.classList.add('highlight-scale');
                                                                                                    }

                                                                                                    // maindish5에 원형 드롭존 스타일 추가 (실제 드롭은 안되고 스타일만)
                                                                                                    const maindish5 = document.querySelector('.cn-maindish5');
                                                                                                    if (maindish5) {
                                                                                                        let fakeDropZone = document.getElementById('maindish5-fake-drop-zone');
                                                                                                        if (!fakeDropZone) {
                                                                                                            fakeDropZone = document.createElement('div');
                                                                                                            fakeDropZone.id = 'maindish5-fake-drop-zone';
                                                                                                            fakeDropZone.className = 'drop-zone circular-drop-zone';
                                                                                                            fakeDropZone.style.display = 'block';
                                                                                                            fakeDropZone.style.pointerEvents = 'none'; // 클릭 불가 (스타일만)
                                                                                                            maindish5.appendChild(fakeDropZone);
                                                                                                        }
                                                                                                        fakeDropZone.style.display = 'block';
                                                                                                    }
                                                                                                };

                                                                                                showSpeechBubbleChina('맛있게 먹었어?', 999999, true, () => {
                                                                                                    buttonClicked = true;
                                                                                                    clearTimeout(fallbackTimer); // 타이머 취소
                                                                                                    proceedToFriedRiceStep();
                                                                                                }, null, '내가 먹어 본 만두 중에서 최고였어');
                                                                                            }, 100); // 다른 이벤트 완료를 위한 짧은 딜레이
                                                                                        }, 400);
                                                                                    }, 1000); // 1초 동안 mandu2.png 표시 (2초에서 단축)
                                                                                }, 200); // 0.2초로 단축
                                                                            }
                                                                        }
                                                                    }
                                                                });

                                                                dish.appendChild(dishDropZone);
                                                            }

                                                            // 드롭존 제거
                                                            dropZone.remove();

                                                            // 하이라이트 제거
                                                            const chopstick1 = document.querySelector('.cn-chopstick');
                                                            const chopstick2 = document.querySelector('.cn-chopstick2');
                                                            if (chopstick1) chopstick1.classList.remove('highlight-scale');
                                                            if (chopstick2) chopstick2.classList.remove('highlight-scale');
                                                            const table1 = document.querySelector('.cn-table1');
                                                            if (table1) table1.classList.remove('highlight-blink');

                                                            // 성공 메시지
                                                            showSpeechBubbleChina('잘했어! 이제 먹어보자.');
                                                        }
                                                    }
                                                });

                                                maindish4.appendChild(dropZone);
                                            }
                                            // 하이라이팅 클래스 추가
                                            dropZone.classList.add('highlight-scale-centered');
                                            dropZone.style.display = 'block';
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
        // 테이블 회전이 활성화되지 않았으면 드래그 불가
        if (!tableRotationEnabled) {
            return;
        }
        
        // 드래그 가능한 아이템 클릭 시 테이블 회전 방지
        const target = e.target;
        if (target.closest('.cn-mainspoon') ||
            target.closest('.cn-chopstick') ||
            target.closest('.cn-chopstick2') ||
            target.closest('.draggable-item')) {
            return; // 테이블 회전 시작 안 함
        }

        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        rotationAtStart = getCurrentRotation();
        currentRotation = rotationAtStart;

        // 이미지 중심점 계산
        const rect = chinaTable1.getBoundingClientRect();
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
        const rect = chinaTable1.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // 현재 마우스 위치에서 각도 계산
        const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);

        // 회전 각도 계산 (시계방향/반시계방향)
        const rotation = currentAngle - startAngle;
        currentRotation = rotation;

        chinaTable1.style.transform = `rotate(${rotation}deg)`;

        // maindish 이미지들을 반대 방향으로 회전시켜 각도 유지
        updateMaindishRotations(rotation);

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
        // 테이블 회전이 활성화되지 않았으면 드래그 불가
        if (!tableRotationEnabled) {
            return;
        }
        
        if (e.touches.length !== 1) return;
        isDragging = true;
        const touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        rotationAtStart = getCurrentRotation();
        currentRotation = rotationAtStart;

        const rect = chinaTable1.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        startAngle = Math.atan2(startY - centerY, startX - centerX) * (180 / Math.PI);
        startAngle -= currentRotation;

        e.preventDefault();
    });

    document.addEventListener('touchmove', (e) => {
        if (!isDragging || e.touches.length !== 1) return;

        const touch = e.touches[0];
        const rect = chinaTable1.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const currentAngle = Math.atan2(touch.clientY - centerY, touch.clientX - centerX) * (180 / Math.PI);
        const rotation = currentAngle - startAngle;
        currentRotation = rotation;

        chinaTable1.style.transform = `rotate(${rotation}deg)`;

        // maindish 이미지들을 반대 방향으로 회전시켜 각도 유지
        updateMaindishRotations(rotation);

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
    const setImageSize = function () {
        const naturalWidth = handImage.naturalWidth;
        const naturalHeight = handImage.naturalHeight;
        const scaledWidth = naturalWidth * 0.8;
        const scaledHeight = naturalHeight * 0.8;
        handImage.style.width = `${pxToVw(scaledWidth)}vw`;
        handImage.style.height = `${pxToVw(scaledHeight)}vw`;
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
        const tableSetting = handElement.closest('.table-setting');
        const tableSettingRect = tableSetting ? tableSetting.getBoundingClientRect() : { left: 0, top: 0 };
        currentX = pxToVw(rect.left - tableSettingRect.left);
        currentY = pxToVw(rect.top - tableSettingRect.top);

        handElement.style.transition = 'none';
        e.preventDefault();
    });

    // 마우스 이동 이벤트
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        // 위치 업데이트 (vw 단위)
        const tableSetting = handElement.closest('.table-setting');
        const tableSettingRect = tableSetting ? tableSetting.getBoundingClientRect() : { left: 0, top: 0 };
        const newX = currentX + pxToVw(deltaX);
        const newY = currentY + pxToVw(deltaY);
        handElement.style.left = `${newX}vw`;
        handElement.style.top = `${newY}vw`;
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
                riceBowlDropZone.style.border = '2px dashed #905431';
                riceBowlDropZone.style.background = 'rgba(245, 243, 229, 0.2)';
                const grabText = document.getElementById('grab-text-china');
                if (grabText) {
                    grabText.style.display = 'block';
                }
            } else {
                riceBowlDropZone.style.border = '';
                riceBowlDropZone.style.background = '';
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
        const tableSetting = handElement.closest('.table-setting');
        const tableSettingRect = tableSetting ? tableSetting.getBoundingClientRect() : { left: 0, top: 0 };
        currentX = pxToVw(rect.left - tableSettingRect.left);
        currentY = pxToVw(rect.top - tableSettingRect.top);

        handElement.style.transition = 'none';
        e.preventDefault();
    });

    document.addEventListener('touchmove', (e) => {
        if (!isDragging || e.touches.length !== 1) return;

        const touch = e.touches[0];
        const deltaX = touch.clientX - startX;
        const deltaY = touch.clientY - startY;

        // 위치 업데이트 (vw 단위)
        const tableSetting = handElement.closest('.table-setting');
        const tableSettingRect = tableSetting ? tableSetting.getBoundingClientRect() : { left: 0, top: 0 };
        const newX = currentX + pxToVw(deltaX);
        const newY = currentY + pxToVw(deltaY);
        handElement.style.left = `${newX}vw`;
        handElement.style.top = `${newY}vw`;
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
                riceBowlDropZone.style.border = '2px dashed #905431';
                riceBowlDropZone.style.background = 'rgba(245, 243, 229, 0.2)';
                const grabText = document.getElementById('grab-text-china');
                if (grabText) {
                    grabText.style.display = 'block';
                }
            } else {
                riceBowlDropZone.style.border = '';
                riceBowlDropZone.style.background = '';
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
    // 단계 전환: MEAL_START
    setPhase('china', GAME_PHASE.MEAL_START);

    const handElement = document.getElementById('hand-draggable-china');
    const riceBowlDropZone = document.getElementById('drop-rice-bowl-china');
    if (riceBowlDropZone) {
        riceBowlDropZone.style.border = '';
        riceBowlDropZone.style.background = '';
    }

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
    img.src = 'resource/jp/grab.png';

    img.onload = function () {
        const naturalWidth = this.naturalWidth;
        const naturalHeight = this.naturalHeight;
        const scaledWidth = naturalWidth * 0.9;
        const scaledHeight = naturalHeight * 0.9;
        img.style.width = `${pxToVw(scaledWidth)}vw`;
        img.style.height = `${pxToVw(scaledHeight)}vw`;

        // 밥그릇 드롭존 위치 기준으로 배치 - vw 단위
        const dropZoneRect = riceBowlDropZone.getBoundingClientRect();
        const tableSetting = document.querySelector('#china-stage .table-setting');
        const tableSettingRect = tableSetting ? tableSetting.getBoundingClientRect() : { left: 0, top: 0 };

        grabImage.style.position = 'absolute';
        const leftVw = pxToVw(dropZoneRect.left - tableSettingRect.left - 140);
        const topVw = pxToVw(dropZoneRect.top - tableSettingRect.top);
        grabImage.style.left = `${leftVw}vw`;
        grabImage.style.top = `${topVw}vw`;
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

// 주전자를 찻잔에 드래그할 때 원형 드랍존 표시
function setupTeapotToCupDropZone() {
    // 찻잔 요소 찾기 (고정된 찻잔 또는 드롭된 찻잔)
    const cupElement = document.querySelector('#china-stage .cn-cup');
    const cupDropZone = document.getElementById('drop-zone-cn-cup');
    
    // 찻잔이 드롭된 경우 드롭존을 찾아서 그 안의 드롭된 아이템을 찾음
    let targetElement = cupElement;
    if (cupDropZone && cupDropZone.classList.contains('filled')) {
        const droppedCup = cupDropZone.querySelector('.dropped-item');
        if (droppedCup) {
            targetElement = droppedCup;
        }
    }
    
    if (!targetElement) return;

    // 기존 드랍존 제거
    const existingDropZone = document.getElementById('teapot-to-cup-drop-zone');
    if (existingDropZone) {
        existingDropZone.remove();
    }

    // 원형 드랍존 생성
    const dropZone = document.createElement('div');
    dropZone.id = 'teapot-to-cup-drop-zone';
    dropZone.className = 'drop-zone circular-drop-zone';
    targetElement.appendChild(dropZone);

    // 드래그 시작 시 드랍존 표시
    const showDropZone = (e) => {
        const itemType = e.target.closest('.slot-item')?.getAttribute('data-item');
        const droppedItem = e.target.closest('.dropped-item');
        const droppedItemType = droppedItem?.getAttribute('data-item-type');

        if (itemType === 'teapot' || droppedItemType === 'teapot') {
            // friendcup이 등장한 후에는 cup 드랍존을 표시하지 않음
            const friendCup = document.getElementById('friend-cup-china');
            if (friendCup && friendCup.classList.contains('show')) {
                return; // friendcup이 있으면 cup 드랍존 표시하지 않음
            }
            
            // 찻잔 요소를 동적으로 찾기 (드롭된 찻잔도 포함)
            const cupDropZone = document.getElementById('drop-zone-cn-cup');
            let targetElement = document.querySelector('#china-stage .cn-cup');
            
            if (cupDropZone && cupDropZone.classList.contains('filled')) {
                const droppedCup = cupDropZone.querySelector('.dropped-item');
                if (droppedCup) {
                    targetElement = droppedCup;
                }
            }
            
            if (targetElement) {
                // 기존 드랍존이 다른 요소에 있으면 제거
                const existingDropZone = document.getElementById('teapot-to-cup-drop-zone');
                if (existingDropZone && existingDropZone.parentElement !== targetElement) {
                    existingDropZone.remove();
                }
                
                // 드랍존이 없으면 생성
                let teapotDropZone = document.getElementById('teapot-to-cup-drop-zone');
                if (!teapotDropZone) {
                    teapotDropZone = document.createElement('div');
                    teapotDropZone.id = 'teapot-to-cup-drop-zone';
                    teapotDropZone.className = 'drop-zone circular-drop-zone';
                    targetElement.appendChild(teapotDropZone);
                    
                    // 이벤트 리스너 다시 설정
                    setupDropZoneEvents(teapotDropZone);
                } else if (teapotDropZone.parentElement !== targetElement) {
                    // 드랍존이 다른 요소에 있으면 이동
                    targetElement.appendChild(teapotDropZone);
                }
                
                teapotDropZone.style.display = 'flex';
            }
        }
    };
    
    // 드랍존 이벤트 설정 함수
    const setupDropZoneEvents = (dropZone) => {
        // 드래그 오버 이벤트: "붓기" 텍스트 표시
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            if (!dropZone.classList.contains('drag-over')) {
                dropZone.classList.add('drag-over');
            }
            dropZone.textContent = '붓기';
            dropZone.style.display = 'flex';
            dropZone.style.justifyContent = 'center';
            dropZone.style.alignItems = 'center';
            dropZone.style.color = 'white';
            dropZone.style.fontSize = '1.5vw';
            dropZone.style.fontWeight = 'bold';
            dropZone.style.textShadow = '0 0 5px black';
        });

        // 드래그 리브 이벤트: 텍스트 제거
        dropZone.addEventListener('dragleave', (e) => {
            if (!dropZone.contains(e.relatedTarget)) {
                dropZone.classList.remove('drag-over');
                dropZone.textContent = '';
            }
        });

        // 드롭 이벤트
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            dropZone.textContent = '';
            dropZone.style.display = 'none';
            
            // 주전자 요소 찾기 (드롭된 주전자 우선, 없으면 고정된 주전자)
            let teapotElement = null;
            const teapotDropZone = document.getElementById('drop-zone-cn-teapot');
            
            // 드롭된 주전자가 있는지 확인
            if (teapotDropZone && teapotDropZone.classList.contains('filled')) {
                const droppedTeapot = teapotDropZone.querySelector('.dropped-item[data-item-type="teapot"]');
                if (droppedTeapot) {
                    teapotElement = droppedTeapot;
                }
            }
            
            // 드롭된 주전자가 없으면 고정된 주전자 확인
            if (!teapotElement) {
                teapotElement = document.querySelector('#china-stage .cn-teapot');
            }
            
            if (teapotElement) {
                // 주전자 이미지 찾기 (shadow-img가 아닌 일반 img)
                const teapotImg = teapotElement.querySelector('img:not(.shadow-img)');
                if (teapotImg) {
                    // 페이드 아웃 -> 이미지 변경 -> 페이드 인
                    teapotImg.style.transition = 'opacity 0.3s ease-in-out';
                    teapotImg.style.opacity = '0';
                    
                    setTimeout(() => {
                        teapotImg.src = 'resource/cn/cn_teapot_a.png';
                        teapotImg.style.opacity = '1';
                        
                        // 기울임 애니메이션 추가
                        teapotElement.classList.add('teapot-pouring');
                        
                        // 애니메이션 종료 시 원래대로 복원
                        const handleAnimationEnd = () => {
                            // 애니메이션 클래스 제거
                            teapotElement.classList.remove('teapot-pouring');
                            
                            // 주전자 드랍존 하이라이팅 제거
                            if (teapotDropZone) {
                                teapotDropZone.classList.remove('highlight-scale');
                            }
                            
                            // transform 초기화
                            teapotElement.style.transform = '';
                            
                            // 이미지 원래대로 복원
                            teapotImg.style.transition = 'opacity 0.3s ease-in-out';
                            teapotImg.style.opacity = '0';
                            
                            setTimeout(() => {
                                teapotImg.src = 'resource/cn/cn_teapot.png';
                                teapotImg.style.opacity = '1';
                            }, 300);
                            
                            // 그림자 이미지도 원래대로 복원
                            const teapotShadowImg = teapotElement.querySelector('img.shadow-img');
                            if (teapotShadowImg) {
                                teapotShadowImg.style.transition = 'opacity 0.3s ease-in-out';
                                teapotShadowImg.style.opacity = '0';
                                
                                setTimeout(() => {
                                    teapotShadowImg.src = 'resource/cn/cn_teapot_s.png';
                                    teapotShadowImg.style.opacity = '1';
                                }, 300);
                            }
                            
                            // 이미지 복원 완료 후 말풍선 표시 및 friendcup 등장
                            setTimeout(() => {
                                // 말풍선 표시
                                showSpeechBubbleChina('나도 차 한잔만 따라줘', 3000);
                                
                                // friendcup.png 좌측 상단에서 애니메이션과 함께 등장
                                const chinaStage = document.getElementById('china-stage');
                                if (chinaStage) {
                                    // 기존 friendcup 제거 (있는 경우)
                                    const existingFriendCup = document.getElementById('friend-cup-china');
                                    if (existingFriendCup) {
                                        existingFriendCup.remove();
                                    }
                                    
                                    // friendcup 요소 생성
                                    const friendCup = document.createElement('div');
                                    friendCup.id = 'friend-cup-china';
                                    friendCup.className = 'friend-cup-china';
                                    
                                    const friendCupImg = document.createElement('img');
                                    friendCupImg.src = 'resource/cn/friendcup.png';
                                    friendCupImg.alt = '친구 찻잔';
                                    
                                    friendCup.appendChild(friendCupImg);
                                    chinaStage.querySelector('.stage-content').appendChild(friendCup);
                                    
                                    // 애니메이션 트리거를 위해 약간의 지연
                                    setTimeout(() => {
                                        friendCup.classList.add('show');
                                        
                                        // friendcup 위에 드랍존 생성
                                        setupTeapotToFriendCupDropZone();
                                        
                                        // "나도 차 한잔만 따라줘" 단계에서는 기존 cup 드랍존 비활성화
                                        const cupDropZone = document.getElementById('teapot-to-cup-drop-zone');
                                        if (cupDropZone) {
                                            cupDropZone.style.pointerEvents = 'none';
                                            cupDropZone.style.display = 'none';
                                        }
                                    }, 50);
                                }
                            }, 600); // 이미지 복원 완료 대기 (300ms + 300ms)
                            
                            // 이벤트 리스너 제거
                            teapotElement.removeEventListener('animationend', handleAnimationEnd);
                        };
                        
                        // 애니메이션 종료 이벤트 리스너 추가
                        teapotElement.addEventListener('animationend', handleAnimationEnd);
                    }, 300);
                }
                
                // 주전자 그림자 이미지도 변경
                const teapotShadowImg = teapotElement.querySelector('img.shadow-img');
                if (teapotShadowImg) {
                    teapotShadowImg.style.transition = 'opacity 0.3s ease-in-out';
                    teapotShadowImg.style.opacity = '0';
                    
                    setTimeout(() => {
                        teapotShadowImg.src = 'resource/cn/cn_teapot_a_s.png';
                        teapotShadowImg.style.opacity = '1';
                    }, 300);
                }
            }
            
            // 찻잔 이미지도 변경
            let cupElement = null;
            const cupDropZone = document.getElementById('drop-zone-cn-cup');
            
            // 드롭된 찻잔이 있는지 확인
            if (cupDropZone && cupDropZone.classList.contains('filled')) {
                const droppedCup = cupDropZone.querySelector('.dropped-item[data-item-type="cup"]');
                if (droppedCup) {
                    cupElement = droppedCup;
                }
            }
            
            // 드롭된 찻잔이 없으면 고정된 찻잔 확인
            if (!cupElement) {
                cupElement = document.querySelector('#china-stage .cn-cup');
            }
            
            if (cupElement) {
                // 찻잔 이미지 찾기 (shadow-img가 아닌 일반 img)
                const cupImg = cupElement.querySelector('img:not(.shadow-img)');
                if (cupImg) {
                    // 페이드 아웃 -> 이미지 변경 -> 페이드 인
                    cupImg.style.transition = 'opacity 0.3s ease-in-out';
                    cupImg.style.opacity = '0';
                    
                    setTimeout(() => {
                        cupImg.src = 'resource/cn/cn_cup_a.png';
                        cupImg.style.opacity = '1';
                    }, 300);
                }
                
                // 찻잔 그림자 이미지도 변경 (있는 경우)
                const cupShadowImg = cupElement.querySelector('img.shadow-img');
                if (cupShadowImg) {
                    cupShadowImg.style.transition = 'opacity 0.3s ease-in-out';
                    cupShadowImg.style.opacity = '0';
                    
                    setTimeout(() => {
                        cupShadowImg.src = 'resource/cn/cn_cup_a_s.png';
                        cupShadowImg.style.opacity = '1';
                    }, 300);
                }
            }
            
            // 주전자 하이라이팅 제거
            const teapotItem = document.querySelector('#china-stage .slot-item[data-item="teapot"]');
            if (teapotItem) {
                teapotItem.classList.remove('highlight-pulse');
            }
            
            // 드롭된 주전자 하이라이팅 제거
            if (teapotDropZone && teapotDropZone.classList.contains('filled')) {
                const droppedTeapot = teapotDropZone.querySelector('.dropped-item[data-item-type="teapot"]');
                if (droppedTeapot) {
                    droppedTeapot.classList.remove('highlight-pulse');
                }
            }
            
            // 손 하이라이팅 제거
            const handElement = document.getElementById('hand-draggable-china');
            if (handElement) {
                handElement.classList.remove('highlight-pulse');
            }
        });
    };
    
    // 초기 드랍존 이벤트 설정
    setupDropZoneEvents(dropZone);

    // 드래그 종료 시 드랍존 숨김
    const hideDropZone = () => {
        const dropZone = document.getElementById('teapot-to-cup-drop-zone');
        if (dropZone) {
            dropZone.style.display = 'none';
            dropZone.classList.remove('drag-over');
            dropZone.textContent = '';
        }
    };

    // 주전자 슬롯 아이템에 드래그 이벤트 추가
    const teapotItem = document.querySelector('#china-stage .slot-item[data-item="teapot"]');
    if (teapotItem) {
        teapotItem.addEventListener('dragstart', showDropZone);
        teapotItem.addEventListener('dragend', hideDropZone);
    }

    // 드롭된 주전자에도 이벤트 추가
    document.addEventListener('dragstart', (e) => {
        const droppedItem = e.target.closest('#china-stage .dropped-item');
        if (droppedItem) {
            const itemType = droppedItem.getAttribute('data-item-type');
            if (itemType === 'teapot') {
                showDropZone(e);
            }
        }
    });

    document.addEventListener('dragend', () => {
        hideDropZone();
    });

}

// 주전자를 friendcup에 드래그할 때 원형 드랍존 표시
function setupTeapotToFriendCupDropZone() {
    const friendCup = document.getElementById('friend-cup-china');
    if (!friendCup) return;

    // 기존 드랍존 제거
    const existingDropZone = document.getElementById('teapot-to-friendcup-drop-zone');
    if (existingDropZone) {
        existingDropZone.remove();
    }

    // 원형 드랍존 생성
    const dropZone = document.createElement('div');
    dropZone.id = 'teapot-to-friendcup-drop-zone';
    dropZone.className = 'drop-zone circular-drop-zone';
    friendCup.appendChild(dropZone);

    // 드래그 시작 시 드랍존 표시
    const showDropZone = (e) => {
        const itemType = e.target.closest('.slot-item')?.getAttribute('data-item');
        const droppedItem = e.target.closest('.dropped-item');
        const droppedItemType = droppedItem?.getAttribute('data-item-type');

        if (itemType === 'teapot' || droppedItemType === 'teapot') {
            const currentFriendCup = document.getElementById('friend-cup-china');
            if (currentFriendCup) {
                let teapotDropZone = document.getElementById('teapot-to-friendcup-drop-zone');
                if (!teapotDropZone) {
                    teapotDropZone = document.createElement('div');
                    teapotDropZone.id = 'teapot-to-friendcup-drop-zone';
                    teapotDropZone.className = 'drop-zone circular-drop-zone';
                    currentFriendCup.appendChild(teapotDropZone);
                    setupDropZoneEvents(teapotDropZone);
                } else if (teapotDropZone.parentElement !== currentFriendCup) {
                    currentFriendCup.appendChild(teapotDropZone);
                }
                teapotDropZone.style.display = 'flex';
            }
        }
    };

    // 드랍존 이벤트 설정 함수
    const setupDropZoneEvents = (dropZone) => {
        // 드래그 오버 이벤트: "붓기" 텍스트 표시
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            if (!dropZone.classList.contains('drag-over')) {
                dropZone.classList.add('drag-over');
            }
            dropZone.textContent = '붓기';
            dropZone.style.display = 'flex';
            dropZone.style.justifyContent = 'center';
            dropZone.style.alignItems = 'center';
            dropZone.style.color = 'white';
            dropZone.style.fontSize = '1.5vw';
            dropZone.style.fontWeight = 'bold';
            dropZone.style.textShadow = '0 0 5px black';
        });

        // 드래그 리브 이벤트: 텍스트 제거
        dropZone.addEventListener('dragleave', (e) => {
            if (!dropZone.contains(e.relatedTarget)) {
                dropZone.classList.remove('drag-over');
                dropZone.textContent = '';
            }
        });

        // 드롭 이벤트
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            dropZone.textContent = '';
            dropZone.style.display = 'none';

            // 주전자 요소 찾기 (드롭된 주전자 우선, 없으면 고정된 주전자)
            let teapotElement = null;
            const teapotDropZone = document.getElementById('drop-zone-cn-teapot');

            // 드롭된 주전자가 있는지 확인
            if (teapotDropZone && teapotDropZone.classList.contains('filled')) {
                const droppedTeapot = teapotDropZone.querySelector('.dropped-item[data-item-type="teapot"]');
                if (droppedTeapot) {
                    teapotElement = droppedTeapot;
                }
            }

            // 드롭된 주전자가 없으면 고정된 주전자 확인
            if (!teapotElement) {
                teapotElement = document.querySelector('#china-stage .cn-teapot');
            }

            if (teapotElement) {
                // friendcup 위치 가져오기
                const friendCup = document.getElementById('friend-cup-china');
                if (friendCup) {
                    // friendcup 이미지 찾기
                    const friendCupImg = friendCup.querySelector('img');
                    
                    // friendcup용 기울임 위치 (별도로 지정 가능)
                    const friendCupPourLeft = 9; // friendcup 위치 기준으로 조정 가능 (vw 단위)
                    const friendCupPourTop = 14; // friendcup 위치 기준으로 조정 가능 (vw 단위)
                    
                    // 주전자를 friendcup 기울임 위치로 이동
                    const originalLeft = teapotElement.style.left;
                    const originalTop = teapotElement.style.top;
                    const originalPosition = teapotElement.style.position;
                    
                    teapotElement.style.position = 'absolute';
                    teapotElement.style.left = `${friendCupPourLeft}vw`;
                    teapotElement.style.top = `${friendCupPourTop}vw`;
                    teapotElement.style.transition = 'left 0.8s ease-out, top 0.8s ease-out';
                    // friendcup보다 위 레이어에 표시 (더 높은 값으로 설정)
                    teapotElement.style.zIndex = '102';
                    
                    // friendcup 이미지를 friendcup_a.png로 교체 (페이드 효과)
                    if (friendCupImg) {
                        friendCupImg.style.transition = 'opacity 0.3s ease-in-out';
                        friendCupImg.style.opacity = '0';
                        
                        setTimeout(() => {
                            friendCupImg.src = 'resource/cn/friendcup_a.png';
                            friendCupImg.style.opacity = '1';
                            // friendcup 이미지의 z-index를 주전자보다 낮게 설정
                            friendCupImg.style.zIndex = '1';
                            friendCupImg.style.position = 'relative';
                        }, 300);
                    }
                    
                    // 주전자 이미지 찾기 (shadow-img가 아닌 일반 img)
                    const teapotImg = teapotElement.querySelector('img:not(.shadow-img)');
                    if (teapotImg) {
                        // 페이드 아웃 -> 이미지 변경 -> 페이드 인
                        teapotImg.style.transition = 'opacity 0.3s ease-in-out';
                        teapotImg.style.opacity = '0';

                        setTimeout(() => {
                            teapotImg.src = 'resource/cn/cn_teapot_a.png';
                            teapotImg.style.opacity = '1';
                            
                            // 이미지도 friendcup보다 위에 표시되도록 z-index 설정
                            teapotImg.style.zIndex = '102';
                            teapotImg.style.position = 'relative';

                            // friendcup용 기울임 애니메이션 추가
                            teapotElement.classList.add('teapot-pouring-friendcup');
                            // 애니메이션 중에도 z-index 유지
                            teapotElement.style.zIndex = '102';
                            
                            // 친구에게 차를 따라주는 예절 인포 메뉴 표시
                            showTeaPouringEtiquetteInfoMenuChina();

                            // 애니메이션 종료 시 원래대로 복원
                            const handleAnimationEnd = () => {
                                // 애니메이션 클래스 제거
                                teapotElement.classList.remove('teapot-pouring-friendcup');
                                
                                // 주전자 드랍존 하이라이팅 제거
                                const teapotDropZone = document.getElementById('drop-zone-cn-teapot');
                                if (teapotDropZone) {
                                    teapotDropZone.classList.remove('highlight-scale');
                                }

                                // transform 초기화
                                teapotElement.style.transform = '';

                                // 이미지 원래대로 복원
                                teapotImg.style.transition = 'opacity 0.3s ease-in-out';
                                teapotImg.style.opacity = '0';

                                setTimeout(() => {
                                    teapotImg.src = 'resource/cn/cn_teapot.png';
                                    teapotImg.style.opacity = '1';
                                    // z-index 초기화
                                    teapotImg.style.zIndex = '';
                                    teapotImg.style.position = '';
                                }, 300);

                                // 그림자 이미지도 원래대로 복원
                                const teapotShadowImg = teapotElement.querySelector('img.shadow-img');
                                if (teapotShadowImg) {
                                    teapotShadowImg.style.transition = 'opacity 0.3s ease-in-out';
                                    teapotShadowImg.style.opacity = '0';

                                    setTimeout(() => {
                                        teapotShadowImg.src = 'resource/cn/cn_teapot_s.png';
                                        teapotShadowImg.style.opacity = '1';
                                    }, 300);
                                }
                                
                                // friendcup 이미지는 friendcup_a.png 상태로 유지 (원래대로 복원하지 않음)

                                // 원래 위치로 복원
                                setTimeout(() => {
                                    teapotElement.style.transition = 'left 0.8s ease-out, top 0.8s ease-out';
                                    teapotElement.style.left = originalLeft || '';
                                    teapotElement.style.top = originalTop || '';
                                    teapotElement.style.position = originalPosition || '';
                                    teapotElement.style.zIndex = '';
                                    
                                    // 이미지 복원 완료 후 말풍선 시퀀스 표시
                                    setTimeout(() => {
                                        // 첫 번째 말풍선: "차 향기가 참 좋다 그지?"
                                        showSpeechBubbleChina('차 향기가 참 좋다 그지?', 0, true, () => {
                                            // 두 번째 말풍선: "이제 계산을 해 볼까?" - 큰 버튼 두 개
                                            showCalculationSelectionChina();
                                        }, null, '그러네');
                                    }, 300);
                                }, 600);

                                // 이벤트 리스너 제거
                                teapotElement.removeEventListener('animationend', handleAnimationEnd);
                            };

                            // 애니메이션 종료 이벤트 리스너 추가
                            teapotElement.addEventListener('animationend', handleAnimationEnd);
                        }, 300);
                    }

                    // 주전자 그림자 이미지도 변경
                    const teapotShadowImg = teapotElement.querySelector('img.shadow-img');
                    if (teapotShadowImg) {
                        teapotShadowImg.style.transition = 'opacity 0.3s ease-in-out';
                        teapotShadowImg.style.opacity = '0';

                        setTimeout(() => {
                            teapotShadowImg.src = 'resource/cn/cn_teapot_a_s.png';
                            teapotShadowImg.style.opacity = '1';
                        }, 300);
                    }
                }
            }

            // 주전자 하이라이팅 제거
            const teapotItem = document.querySelector('#china-stage .slot-item[data-item="teapot"]');
            if (teapotItem) {
                teapotItem.classList.remove('highlight-pulse');
            }

            // 드롭된 주전자 하이라이팅 제거
            if (teapotDropZone && teapotDropZone.classList.contains('filled')) {
                const droppedTeapot = teapotDropZone.querySelector('.dropped-item[data-item-type="teapot"]');
                if (droppedTeapot) {
                    droppedTeapot.classList.remove('highlight-pulse');
                }
            }

            // 손 하이라이팅 제거
            const handElement = document.getElementById('hand-draggable-china');
            if (handElement) {
                handElement.classList.remove('highlight-pulse');
            }
        });
    };

    // 초기 드랍존 이벤트 설정
    setupDropZoneEvents(dropZone);

    // 드래그 종료 시 드랍존 숨김
    const hideDropZone = () => {
        const dropZone = document.getElementById('teapot-to-friendcup-drop-zone');
        if (dropZone) {
            dropZone.style.display = 'none';
            dropZone.classList.remove('drag-over');
            dropZone.textContent = '';
        }
    };

    // 주전자 슬롯 아이템에 드래그 이벤트 추가
    const teapotItem = document.querySelector('#china-stage .slot-item[data-item="teapot"]');
    if (teapotItem) {
        teapotItem.addEventListener('dragstart', showDropZone);
        teapotItem.addEventListener('dragend', hideDropZone);
    }

    // 드롭된 주전자에도 이벤트 추가
    document.addEventListener('dragstart', (e) => {
        const droppedItem = e.target.closest('#china-stage .dropped-item');
        if (droppedItem) {
            const itemType = droppedItem.getAttribute('data-item-type');
            if (itemType === 'teapot') {
                showDropZone(e);
            }
        }
    });

    document.addEventListener('dragend', () => {
        hideDropZone();
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

    // 단계 확인: "식사를 시작해볼까요" 단계(UTENSILS_PLACED)인지 확인
    // 이 단계에서는 손으로 밥그릇을 먼저 집어야 하므로 수저 사용을 막아야 함
    const isUtensilsPlacedNow = isUtensilsPlacedPhase('china');
    const isMealStartNow = isMealStartPhase('china');

    // 꽂기로 드롭한 경우 메시지 표시
    if (action === 'stick') {
        showSpeechBubbleChina('그러면 안 돼요!', 3000);
        if (itemType === 'chopsticks') {
            showChopsticksInfoMenuChina();
        } else {
            showUtensilHoldingInfoMenuChina();
        }
    } else if (action === 'pick') {
        // "식사를 시작해볼까요" 단계(UTENSILS_PLACED)에서는 진행 막고 info 메뉴 표시
        // 손으로 밥그릇을 먼저 집어야 함
        if (isUtensilsPlacedNow && !isMealStartNow) {
            showSpeechBubbleChina('손으로 그릇을 먼저 집어야 해요', 3000);
            showUtensilHoldingInfoMenuChina();
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
    cheftableRiceBowl.setAttribute('data-image', 'resource/jp/dish.png');

    const img = document.createElement('img');
    img.src = 'resource/jp/dish.png';

    img.onload = function () {
        const naturalWidth = this.naturalWidth;
        const naturalHeight = this.naturalHeight;
        this.style.width = `${pxToVw(naturalWidth * 0.8)}vw`;
        this.style.height = `${pxToVw(naturalHeight * 0.8)}vw`;
    };

    cheftableRiceBowl.appendChild(img);
    tableSetting.appendChild(cheftableRiceBowl);

    setTimeout(() => {
        const cheftableRect = topCheftable.getBoundingClientRect();
        const tableSettingRect = tableSetting.getBoundingClientRect();
        const finalRect = document.getElementById('drop-rice-bowl-china')?.getBoundingClientRect();

        if (finalRect) {
            const startTop = pxToVw(cheftableRect.bottom - tableSettingRect.top);
            const endTop = pxToVw(finalRect.top - tableSettingRect.top);

            const leftVw = pxToVw(finalRect.left - tableSettingRect.left + finalRect.width / 2);
            cheftableRiceBowl.style.left = `${leftVw}vw`;
            cheftableRiceBowl.style.top = `${startTop}vw`;
            cheftableRiceBowl.style.transform = 'translate(-50%, 0)';
            cheftableRiceBowl.style.transition = 'top 1s ease-out';

            requestAnimationFrame(() => {
                cheftableRiceBowl.style.top = `${endTop}vw`;
            });
        }
    }, 100);
}

// 페이지 로드 시 드롭 존 크기 초기화 (스테이지가 처음 열릴 때를 대비)
window.addEventListener('load', () => {
    // 모든 이미지 로드 완료 후 실행
    waitForAllImages(() => {
        // 스테이지가 이미 활성화되어 있다면 드롭 존 크기 조정
        if (document.getElementById('japan-stage')?.classList.contains('active')) {
            adjustDropZonesToImageSize();
            // 그림자 이미지 동기화
            setTimeout(() => syncShadowPositions(), 300);
        }
        if (document.getElementById('china-stage')?.classList.contains('active')) {
            adjustDropZonesToImageSizeChina();
        }
        // 손 이미지 드래그 기능 초기화
        initializeHandDragging();
    });
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
    const speechBubbleContent = speechBubble ? speechBubble.querySelector('.speech-bubble-content') : null;
    const speechText = document.getElementById('speech-text-china');
    const nextBtn = document.getElementById('next-speech-btn-china');
    const buttonsContainer = document.getElementById('next-buttons-container-china');

    if (!speechBubble || !speechText) return;

    // 기존 타이머 취소 (말풍선 충돌 방지)
    if (window.currentSpeechBubbleTimeoutChina) {
        clearTimeout(window.currentSpeechBubbleTimeoutChina);
        window.currentSpeechBubbleTimeoutChina = null;
    }

    // 기존 버튼 컨테이너 제거 (calculation-selection-buttons, leftovers-selection-buttons 등)
    if (speechBubbleContent) {
        const existingButtons = speechBubbleContent.querySelectorAll('.calculation-selection-buttons, .leftovers-selection-buttons');
        existingButtons.forEach(btn => btn.remove());
        
        // 말풍선 크기 초기화 (버튼이 없는 경우)
        if (!buttons || !Array.isArray(buttons) || buttons.length === 0) {
            speechBubbleContent.style.minHeight = '';
            speechBubbleContent.style.maxWidth = '';
            speechBubbleContent.style.padding = '';
        }
    }

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
                button.style.whiteSpace = 'nowrap'; // 줄바꿈 방지
                button.style.flex = '0 0 auto'; // flex-grow, flex-shrink, flex-basis를 auto로 설정하여 텍스트 길이에 맞게 조정
                button.style.width = 'auto'; // 텍스트 길이에 맞게 자동 조정
                button.style.minWidth = 'fit-content'; // 최소 너비를 콘텐츠에 맞게
                button.style.maxWidth = 'none'; // max-width 제한 제거
                // padding은 CSS 기본값 사용 (15px 30px)
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
            // 다시하기 버튼인 경우 아이콘으로 표시
            if (buttonText === '다시하기') {
                nextBtn.textContent = '';
                nextBtn.classList.add('rewind-btn');
            } else {
                nextBtn.classList.remove('rewind-btn');
            // 버튼 텍스트 설정 (지정된 텍스트가 있으면 사용, 없으면 기본값)
            if (buttonText) {
                nextBtn.textContent = buttonText;
            } else {
                nextBtn.textContent = BUTTON_TEXTS.nextChina;
                }
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
                
                // 다시하기 버튼인 경우 아이콘으로 표시
                if (buttonText === '다시하기') {
                    nextBtn.textContent = '';
                    nextBtn.classList.add('rewind-btn');
                } else {
                    nextBtn.classList.remove('rewind-btn');
                    if (buttonText) {
                        nextBtn.textContent = buttonText;
                    } else {
                        nextBtn.textContent = BUTTON_TEXTS.nextChina;
                    }
                }
                
                nextBtn.onclick = () => {
                    if (onNextCallback) {
                        onNextCallback();
                    }
                };
            }

            // 지정된 시간 후 자동으로 사라짐 (버튼이 없을 때만)
            if (duration > 0 && !showNextButton && !buttons) {
                window.currentSpeechBubbleTimeoutChina = setTimeout(() => {
                    speechBubble.classList.remove('show');
                    if (nextCallback) nextCallback();
                    window.currentSpeechBubbleTimeoutChina = null;
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
    infoMenu.style.top = '300px';
    infoMenu.style.right = '-25vw';
    setTimeout(() => {
        infoMenu.style.transition = 'right 0.5s ease-out';
        infoMenu.style.right = '20px';
    }, 50);
}

function closeChopsticksInfoMenuChina() {
    const infoMenu = document.getElementById('chopsticks-info-menu-china');
    if (!infoMenu) return;
    infoMenu.style.transition = 'right 0.5s ease-in';
    infoMenu.style.right = '-25vw';
    setTimeout(() => {
        infoMenu.style.display = 'none';
    }, 500);
}

function showUtensilHoldingInfoMenuChina() {
    const infoMenu = document.getElementById('utensil-holding-info-menu-china');
    if (!infoMenu) return;
    infoMenu.style.display = 'block';
    infoMenu.style.top = '300px';
    infoMenu.style.right = '-25vw';
    setTimeout(() => {
        infoMenu.style.transition = 'right 0.5s ease-out';
        infoMenu.style.right = '20px';
    }, 50);
}

function closeUtensilHoldingInfoMenuChina() {
    const infoMenu = document.getElementById('utensil-holding-info-menu-china');
    if (!infoMenu) return;
    infoMenu.style.transition = 'right 0.5s ease-in';
    infoMenu.style.right = '-25vw';
    setTimeout(() => {
        infoMenu.style.display = 'none';
    }, 500);
}

// 중국 스테이지 음식 주문 예절 정보 메뉴 표시
function showFoodOrderInfoMenuChina() {
    const infoMenu = document.getElementById('food-order-info-menu-china');
    if (!infoMenu) return;
    infoMenu.style.display = 'block';
    infoMenu.style.top = '300px';
    infoMenu.style.right = '-25vw';
    setTimeout(() => {
        infoMenu.style.transition = 'right 0.5s ease-out';
        infoMenu.style.right = '20px';
    }, 50);
}

// 중국 스테이지 음식 주문 예절 정보 메뉴 닫기
function closeFoodOrderInfoMenuChina() {
    const infoMenu = document.getElementById('food-order-info-menu-china');
    if (!infoMenu) return;
    infoMenu.style.transition = 'right 0.5s ease-in';
    infoMenu.style.right = '-25vw';
    setTimeout(() => {
        infoMenu.style.display = 'none';
    }, 500);
}

// 중국 스테이지 테이블 회전 예절 정보 메뉴 표시
function showTableRotationInfoMenuChina() {
    const infoMenu = document.getElementById('table-rotation-info-menu-china');
    if (!infoMenu) return;
    infoMenu.style.display = 'block';
    infoMenu.style.top = '300px';
    infoMenu.style.right = '-25vw';
    setTimeout(() => {
        infoMenu.style.transition = 'right 0.5s ease-out';
        infoMenu.style.right = '20px';
    }, 50);
}

// 중국 스테이지 테이블 회전 예절 정보 메뉴 닫기
function closeTableRotationInfoMenuChina() {
    const infoMenu = document.getElementById('table-rotation-info-menu-china');
    if (!infoMenu) return;
    infoMenu.style.transition = 'right 0.5s ease-in';
    infoMenu.style.right = '-25vw';
    setTimeout(() => {
        infoMenu.style.display = 'none';
    }, 500);
}

// 계산 선택 말풍선 표시 (친구에게 맡긴다 / 내가 계산한다)
function showCalculationSelectionChina() {
    const speechBubble = document.getElementById('speech-bubble-china');
    const speechBubbleContent = speechBubble ? speechBubble.querySelector('.speech-bubble-content') : null;
    const speechText = document.getElementById('speech-text-china');
    const nextBtn = document.getElementById('next-speech-btn-china');
    const buttonsContainer = document.getElementById('next-buttons-container-china');
    
    if (!speechBubble || !speechBubbleContent || !speechText) return;
    
    // 기존 버튼 제거 및 숨기기
    if (nextBtn) {
        nextBtn.style.display = 'none';
    }
    if (buttonsContainer) {
        buttonsContainer.style.display = 'none';
        buttonsContainer.innerHTML = '';
    }
    const existingButtons = speechBubbleContent.querySelectorAll('.next-btn, .next-buttons-container, .calculation-selection-buttons');
    existingButtons.forEach(btn => btn.remove());
    
    // 말풍선 내용 설정
    speechText.textContent = '이제 계산을 해 볼까?';
    speechBubble.classList.add('show');
    
    // 말풍선 크기 조정 (버튼에 맞게 늘어나게)
    speechBubbleContent.style.transition = 'min-height 0.5s ease-in-out, max-width 0.5s ease-in-out, padding 0.5s ease-in-out';
    speechBubbleContent.style.minHeight = '480px';
    speechBubbleContent.style.maxWidth = '1280px';
    speechBubbleContent.style.padding = '40px 40px 120px 40px';
    
    // 좌우로 배치된 버튼 컨테이너 생성
    const calculationButtonsContainer = document.createElement('div');
    calculationButtonsContainer.className = 'calculation-selection-buttons';
    calculationButtonsContainer.style.display = 'flex';
    calculationButtonsContainer.style.flexDirection = 'row';
    calculationButtonsContainer.style.justifyContent = 'space-between';
    calculationButtonsContainer.style.gap = '40px';
    calculationButtonsContainer.style.marginTop = '40px';
    calculationButtonsContainer.style.width = '100%';
    calculationButtonsContainer.style.position = 'relative';
    calculationButtonsContainer.style.zIndex = '10011';
    
    // 좌측 버튼: 친구에게 맡긴다
    const leftButton = document.createElement('button');
    leftButton.className = 'next-btn';
    leftButton.style.flex = '1';
    leftButton.style.margin = '0';
    leftButton.style.minWidth = '280px';
    leftButton.style.minHeight = '320px';
    leftButton.style.display = 'flex';
    leftButton.style.flexDirection = 'column';
    leftButton.style.alignItems = 'center';
    leftButton.style.justifyContent = 'flex-start';
    leftButton.style.gap = '16px';
    leftButton.style.padding = '24px';
    leftButton.style.position = 'relative';
    leftButton.style.zIndex = '10012';
    
    // 이미지 컨테이너 (나중에 이미지 추가 예정)
    const leftImageContainer = document.createElement('div');
    leftImageContainer.style.width = '200px';
    leftImageContainer.style.height = '200px';
    leftImageContainer.style.backgroundColor = 'transparent';
    leftImageContainer.style.display = 'flex';
    leftImageContainer.style.alignItems = 'center';
    leftImageContainer.style.justifyContent = 'center';
    leftButton.appendChild(leftImageContainer);
    
    // 텍스트 (이미지 아래로)
    const leftText = document.createElement('span');
    leftText.textContent = '친구에게 맡긴다';
    leftText.style.fontSize = '19px';
    leftText.style.whiteSpace = 'nowrap';
    leftText.style.marginTop = 'auto'; // 아래로 밀기
    leftButton.appendChild(leftText);
    
    leftButton.onclick = () => {
        // 기존 말풍선을 기본 스타일로 되돌리기
        resetSpeechBubbleToDefaultChina();
        
        // 새로운 말풍선 표시: "정말 좋은 식사였어!"
        // 다시하기 버튼 클릭 시 이전 말풍선으로 돌아가기
        showSpeechBubbleChina('정말 좋은 식사였어!', -1, true, () => {
            // 다시하기 버튼 클릭 시 이전 말풍선으로 돌아가기
            showCalculationSelectionChina();
        }, null, '다시하기', null);
        
        // 말풍선과 버튼이 완전히 표시된 후 인포 메뉴 표시
        // 타이핑 효과 시간 + 약간의 여유 시간을 고려하여 딜레이 추가
        setTimeout(() => {
            showCalculationEtiquetteInfoMenuChina();
        }, 500);
    };
    calculationButtonsContainer.appendChild(leftButton);
    
    // 우측 버튼: 내가 계산한다
    const rightButton = document.createElement('button');
    rightButton.className = 'next-btn';
    rightButton.style.flex = '1';
    rightButton.style.margin = '0';
    rightButton.style.minWidth = '280px';
    rightButton.style.minHeight = '320px';
    rightButton.style.display = 'flex';
    rightButton.style.flexDirection = 'column';
    rightButton.style.alignItems = 'center';
    rightButton.style.justifyContent = 'flex-start';
    rightButton.style.gap = '16px';
    rightButton.style.padding = '24px';
    rightButton.style.position = 'relative';
    rightButton.style.zIndex = '10012';
    
    // 이미지 컨테이너 (나중에 이미지 추가 예정)
    const rightImageContainer = document.createElement('div');
    rightImageContainer.style.width = '200px';
    rightImageContainer.style.height = '200px';
    rightImageContainer.style.backgroundColor = 'transparent';
    rightImageContainer.style.display = 'flex';
    rightImageContainer.style.alignItems = 'center';
    rightImageContainer.style.justifyContent = 'center';
    rightButton.appendChild(rightImageContainer);
    
    // 텍스트 (이미지 아래로)
    const rightText = document.createElement('span');
    rightText.textContent = '내가 계산한다';
    rightText.style.fontSize = '19px';
    rightText.style.whiteSpace = 'nowrap';
    rightText.style.marginTop = 'auto'; // 아래로 밀기
    rightButton.appendChild(rightText);
    
    rightButton.onclick = () => {
        // 기존 말풍선을 기본 스타일로 되돌리기
        resetSpeechBubbleToDefaultChina();
        
        // 새로운 말풍선 표시: "당연히 초대한 사람이 사야지!"
        // 다시하기 버튼 클릭 시 이전 말풍선으로 돌아가기
        showSpeechBubbleChina('당연히 초대한 사람이 사야지!', -1, true, () => {
            // 다시하기 버튼 클릭 시 이전 말풍선으로 돌아가기
            showCalculationSelectionChina();
        }, null, '다시하기', null);
        
        // 말풍선과 버튼이 완전히 표시된 후 인포 메뉴 표시
        // 타이핑 효과 시간 + 약간의 여유 시간을 고려하여 딜레이 추가
        setTimeout(() => {
            showCalculationEtiquetteInfoMenuChina();
        }, 500);
    };
    calculationButtonsContainer.appendChild(rightButton);
    
    // 버튼 컨테이너를 말풍선 안에 추가
    speechBubbleContent.appendChild(calculationButtonsContainer);
}

// 중국 스테이지 계산 예절 정보 메뉴 표시
function showCalculationEtiquetteInfoMenuChina() {
    const infoMenu = document.getElementById('info-menu-china');
    const infoTitle = document.getElementById('info-title-china');
    const infoDesc = document.getElementById('info-desc-china');
    
    if (infoMenu && infoTitle && infoDesc) {
        infoTitle.textContent = '계산 예절';
        infoDesc.innerHTML = '중국에서는 초대한 손님이 계산하는 것이 예의입니다.<br><br>식사에 초대한 사람이 계산을 하는 것이<br>중국 문화에서 올바른 예절입니다.<br><br>초대받은 사람이 계산하려고 하는 것은<br>호의로 받아들이지만, 일반적으로는<br>초대한 사람이 계산을 담당합니다.';
        infoMenu.style.display = 'block';
        infoMenu.style.top = '300px';
        infoMenu.style.right = '-25vw';
        setTimeout(() => {
            infoMenu.style.transition = 'right 0.5s ease-out';
            infoMenu.style.right = '20px';
        }, 50);
        
        // 5초 후 자동으로 닫기
        setTimeout(() => {
            infoMenu.style.transition = 'right 0.5s ease-in';
            infoMenu.style.right = '-25vw';
            setTimeout(() => {
                infoMenu.style.display = 'none';
            }, 500); // 애니메이션 완료 후 숨김
        }, 5000);
    }
}

// 중국 스테이지 차 따라주는 예절 정보 메뉴 표시
function showTeaPouringEtiquetteInfoMenuChina() {
    const infoMenu = document.getElementById('info-menu-china');
    const infoTitle = document.getElementById('info-title-china');
    const infoDesc = document.getElementById('info-desc-china');
    
    if (infoMenu && infoTitle && infoDesc) {
        infoTitle.textContent = '차 따라주는 예절';
        infoDesc.innerHTML = '중국에서는 친구나 손님에게 차를 따라줄 때<br>예의를 지켜야 합니다.<br><br>주전자를 친구의 찻잔 쪽으로 기울여<br>차를 따라주는 것이 올바른 예절입니다.<br><br>상대방의 찻잔에 정확히 따라주는 것은<br>배려와 존중을 나타내는 행동입니다.';
        infoMenu.style.display = 'block';
        infoMenu.style.top = '300px';
        infoMenu.style.right = '-25vw';
        setTimeout(() => {
            infoMenu.style.transition = 'right 0.5s ease-out';
            infoMenu.style.right = '20px';
        }, 50);
        
        // 애니메이션 종료 후 자동으로 닫기 (약 5초 후)
        setTimeout(() => {
            infoMenu.style.transition = 'right 0.5s ease-in';
            infoMenu.style.right = '-25vw';
            setTimeout(() => {
                infoMenu.style.display = 'none';
            }, 500); // 애니메이션 완료 후 숨김
        }, 5000); // 충분한 시간 제공 (5초)
    }
}

// 일반 정보 메뉴 닫기
function closeInfoMenuChina() {
    const infoMenu = document.getElementById('info-menu-china');
    if (!infoMenu) return;
    infoMenu.style.transition = 'right 0.5s ease-in';
    infoMenu.style.right = '-25vw';
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
        text: '메뉴는 몇 개 시키면 될까?',
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
                                                const text = '테이블을 돌려저 저 볶음밥좀 먹게 해줄래?';
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

                                                        // 테이블 회전 대기 상태 활성화 (전역 변수와 로컬 변수 모두)
                                                        enableTableRotationCheck = true; // 전역 변수
                                                        if (window.setEnableTableRotationCheck) {
                                                            window.setEnableTableRotationCheck(true); // 로컬 변수
                                                        }
                                                        
                                                        // 테이블 회전 기능 활성화
                                                        if (window.enableChinaTableRotation) {
                                                            window.enableChinaTableRotation();
                                                        } else {
                                                            // 함수가 아직 등록되지 않았으면 직접 활성화
                                                            const table1 = document.querySelector('.cn-table1');
                                                            if (table1) {
                                                                table1.style.pointerEvents = 'auto';
                                                                table1.style.cursor = 'grab';
                                                            }
                                                        }
                                                        
                                                        // 테이블1 하이라이트 (하얀색 그림자 깜빡임)
                                                        const table1 = document.querySelector('.cn-table1');
                                                        if (table1) {
                                                            table1.classList.add('highlight-blink');
                                                        }
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
    fingerImg.src = 'resource/jp/finger.png';
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

    // 손가락 이미지 크기 설정 - vw 단위
    fingerImg.onload = function () {
        const naturalWidth = this.naturalWidth;
        const naturalHeight = this.naturalHeight;
        const scale = 0.15; // 손가락 가이드는 작게 (반으로 줄임)
        this.style.width = `${pxToVw(naturalWidth * scale)}vw`;
        this.style.height = `${pxToVw(naturalHeight * scale)}vw`;
    };

    // 초기 위치 설정 - vw 단위
    const startXVw = pxToVw(startX);
    const startYVw = pxToVw(startY);
    const endXVw = pxToVw(endX);
    const endYVw = pxToVw(endY);

    fingerGuide.style.position = 'absolute';
    fingerGuide.style.left = `${startXVw}vw`;
    fingerGuide.style.top = `${startYVw}vw`;
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
        fingerGuide.style.left = `${endXVw}vw`;
        fingerGuide.style.top = `${endYVw}vw`;

        // 드롭존에서 잠시 대기 후 다시 밥그릇으로
        setTimeout(() => {
            fingerGuide.style.transition = 'left 0.5s ease-in-out, top 0.5s ease-in-out';
            fingerGuide.style.left = `${startXVw}vw`;
            fingerGuide.style.top = `${startYVw}vw`;

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
    riceBowl.setAttribute('data-image', 'resource/jp/dish.png');

    const img = document.createElement('img');
    img.src = 'resource/jp/dish.png';
    img.style.display = 'block';

    // 이미지가 로드된 후 위치 설정 및 애니메이션 시작
    const setupPositionAndAnimate = () => {
        // 셰프테이블 위치 확인 (중앙 계산용)
        const cheftableRect = topCheftable.getBoundingClientRect();
        const tableSettingRect = tableSetting.getBoundingClientRect();

        // 이미지 크기 설정 - vw 단위
        const naturalWidth = img.naturalWidth;
        const naturalHeight = img.naturalHeight;
        const scaledWidth = naturalWidth * 0.8;
        const scaledHeight = naturalHeight * 0.8;
        img.style.width = `${pxToVw(scaledWidth)}vw`;
        img.style.height = `${pxToVw(scaledHeight)}vw`;

        // 초기 위치 (애니메이션 시작 위치) - vw 단위
        const startTop = -12.7 - 5; // 최종 위치보다 조금 위에서 시작
        const centerLeft = 69.4;

        // 최종 위치 - vw 단위
        const endTop = -12.7;

        riceBowl.style.position = 'absolute';
        riceBowl.style.left = `${centerLeft}vw`;
        riceBowl.style.top = `${startTop}vw`;
        riceBowl.style.transform = 'translate(-50%, 0)';
        riceBowl.style.opacity = '0';
        riceBowl.style.transition = 'opacity 0.5s ease-in, top 1s ease-out';
        riceBowl.style.zIndex = '10';
        riceBowl.style.cursor = 'grab';

        // 나타나는 애니메이션 (아래로 내려오기)
        setTimeout(() => {
            riceBowl.style.opacity = '1';
            riceBowl.style.top = `${endTop}vw`;
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

// 말풍선 자동 숨김 타이머 추적 변수
let currentSpeechBubbleTimeout = null;

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

    // 이전 자동 숨김 타이머가 있으면 취소
    if (currentSpeechBubbleTimeout) {
        clearTimeout(currentSpeechBubbleTimeout);
        currentSpeechBubbleTimeout = null;
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
                    // 말풍선 숨기기 (버튼 클릭 시)
                    hideSpeechBubble();
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

            // 지정된 시간 후 자동으로 사라짐 (버튼이 없을 때만, duration이 0보다 클 때만)
            // duration이 -1이면 버튼을 누를 때까지 유지
            if (duration > 0 && !showNextButton && !buttons) {
                currentSpeechBubbleTimeout = setTimeout(() => {
                    hideSpeechBubble();
                    currentSpeechBubbleTimeout = null;
                }, duration);
            }
            // duration이 0이거나 -1이고 버튼이 있으면 자동으로 사라지지 않음
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

// 다른 것도 드셔보시겠어요? 말풍선 표시
function showAnotherDishQuestion() {
    // 5단계: 사이드 먹기로 전환 ("다른 것도 드셔보시겠어요?" 시점)
    // 이미 showCompletionMessage()에서 전환되었을 수 있지만, 확실하게 전환
    setPhase('japan', GAME_PHASE.SIDE_DISH);

    // "물론이죠" 버튼 클릭 시 말풍선 확장 및 선택 버튼 표시하는 콜백
    const onNextClick = () => {
        expandSpeechBubbleForDishSelection();
    };

    showSpeechBubble('다른 것도 드셔보시겠어요?', -1, true, onNextClick, null, '물론이죠', null);
}

// 말풍선 확장 및 선택 버튼 표시
function expandSpeechBubbleForDishSelection() {
    const speechBubble = document.getElementById('speech-bubble');
    const speechBubbleContent = speechBubble ? speechBubble.querySelector('.speech-bubble-content') : null;
    const nextBtn = document.getElementById('next-speech-btn');

    if (!speechBubble || !speechBubbleContent) return;

    // 기존 버튼 숨기기
    if (nextBtn) {
        nextBtn.style.display = 'none';
    }

    // 기존 선택 버튼 컨테이너가 있으면 제거
    const existingSelectionContainer = speechBubbleContent.querySelector('.dish-selection-buttons');
    if (existingSelectionContainer) {
        existingSelectionContainer.remove();
    }

    // 말풍선 세로로 더 넓게, 가로로도 더 넓게 확장 (이미지와 텍스트를 위한 공간 확보)
    speechBubbleContent.style.transition = 'min-height 0.5s ease-in-out, max-width 0.5s ease-in-out, padding 0.5s ease-in-out';
    speechBubbleContent.style.minHeight = '480px'; // 세로 더 크게 (이미지 공간 확보) - 20% 감소
    speechBubbleContent.style.maxWidth = '1280px'; // 가로 더 넓게 - 20% 감소
    speechBubbleContent.style.padding = '40px 40px 120px 40px'; // 20% 감소

    // 좌우로 배치된 버튼 컨테이너 생성 (말풍선 안에 새로 만들기)
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'dish-selection-buttons';
    buttonsContainer.style.display = 'flex';
    buttonsContainer.style.flexDirection = 'row';
    buttonsContainer.style.justifyContent = 'space-between';
    buttonsContainer.style.gap = '40px'; // 20% 감소
    buttonsContainer.style.marginTop = '40px'; // 20% 감소
    buttonsContainer.style.width = '100%';
    buttonsContainer.style.position = 'relative';
    buttonsContainer.style.zIndex = '10011'; // 최상단 레이어

    // 좌측 버튼: 남김없이 먹기
    const leftButton = document.createElement('button');
    leftButton.className = 'next-btn';
    leftButton.style.flex = '1';
    leftButton.style.margin = '0';
    leftButton.style.minWidth = '280px'; // 텍스트 줄바꿈 방지를 위한 최소 너비 - 20% 감소
    leftButton.style.minHeight = '320px'; // 이미지와 텍스트를 위한 높이 - 20% 감소
    leftButton.style.display = 'flex';
    leftButton.style.flexDirection = 'column';
    leftButton.style.alignItems = 'center';
    leftButton.style.justifyContent = 'center';
    leftButton.style.gap = '16px'; // 20% 감소
    leftButton.style.padding = '24px'; // 20% 감소
    leftButton.style.position = 'relative';
    leftButton.style.zIndex = '10012'; // 최상단 레이어

    // 이미지 컨테이너 (나중에 이미지 추가 예정)
    const leftImageContainer = document.createElement('div');
    leftImageContainer.style.width = '200px'; // 20% 감소
    leftImageContainer.style.height = '200px'; // 20% 감소
    leftImageContainer.style.backgroundColor = 'transparent';
    leftImageContainer.style.display = 'flex';
    leftImageContainer.style.alignItems = 'center';
    leftImageContainer.style.justifyContent = 'center';
    // 이미지는 나중에 추가
    leftButton.appendChild(leftImageContainer);

    // 텍스트
    const leftText = document.createElement('span');
    leftText.textContent = '남김없이 먹기';
    leftText.style.fontSize = '19px'; // 20% 감소 (24px * 0.8 = 19.2px)
    leftText.style.whiteSpace = 'nowrap'; // 줄바꿈 방지
    leftButton.appendChild(leftText);

    leftButton.onclick = () => {
        handleDishSelection('empty');
    };
    buttonsContainer.appendChild(leftButton);

    // 우측 버튼: 조금 남기기
    const rightButton = document.createElement('button');
    rightButton.className = 'next-btn';
    rightButton.style.flex = '1';
    rightButton.style.margin = '0';
    rightButton.style.minWidth = '280px'; // 텍스트 줄바꿈 방지를 위한 최소 너비 - 20% 감소
    rightButton.style.minHeight = '320px'; // 이미지와 텍스트를 위한 높이 - 20% 감소
    rightButton.style.display = 'flex';
    rightButton.style.flexDirection = 'column';
    rightButton.style.alignItems = 'center';
    rightButton.style.justifyContent = 'center';
    rightButton.style.gap = '16px'; // 20% 감소
    rightButton.style.padding = '24px'; // 20% 감소
    rightButton.style.position = 'relative';
    rightButton.style.zIndex = '10012'; // 최상단 레이어

    // 이미지 컨테이너 (나중에 이미지 추가 예정)
    const rightImageContainer = document.createElement('div');
    rightImageContainer.style.width = '200px'; // 20% 감소
    rightImageContainer.style.height = '200px'; // 20% 감소
    rightImageContainer.style.backgroundColor = 'transparent';
    rightImageContainer.style.display = 'flex';
    rightImageContainer.style.alignItems = 'center';
    rightImageContainer.style.justifyContent = 'center';
    // 이미지는 나중에 추가
    rightButton.appendChild(rightImageContainer);

    // 텍스트
    const rightText = document.createElement('span');
    rightText.textContent = '조금 남기기';
    rightText.style.fontSize = '19px'; // 20% 감소 (24px * 0.8 = 19.2px)
    rightText.style.whiteSpace = 'nowrap'; // 줄바꿈 방지
    rightButton.appendChild(rightText);

    rightButton.onclick = () => {
        handleDishSelection('leave');
    };
    buttonsContainer.appendChild(rightButton);

    // 버튼 컨테이너를 말풍선 안에 추가
    speechBubbleContent.appendChild(buttonsContainer);
}

// 선택 버튼 클릭 처리
function handleDishSelection(choice) {
    if (choice === 'leave') {
        // 조금 남기기 처리
        console.log('조금 남기기 선택');
        
        // 말풍선은 그대로 두고 텍스트만 변경 (버튼과 크기 유지)
        const speechBubble = document.getElementById('speech-bubble');
        const speechText = document.getElementById('speech-text');
        
        if (speechBubble && speechText) {
            // 텍스트만 변경
            speechText.textContent = '...입에 안 맞으셨나요?';
        }
        
        // 인포 메뉴 표시
        showEatingEtiquetteInfoMenu();
        return; // 여기서 종료하여 아래 코드 실행 방지
    }

    // 남김없이 먹기 선택 시에만 말풍선을 기본 스타일로 되돌리기
    resetSpeechBubbleToDefault();

    // 사이드 먹기 단계는 이미 grab4 표시 시점에 전환되었으므로 여기서는 선택 처리만
    // 선택에 따른 처리
    if (choice === 'empty') {
        // 남김없이 먹기 처리
        console.log('남김없이 먹기 선택');
        // 인포 메뉴 표시
        showEatingEtiquetteInfoMenu();

        // dish5와 dish2 이미지를 Finished 버전으로 변경 (애니메이션 적용)
        changeDishToFinished();

        // "다 드셨다니 입에 맞으셨나 보네요!" 말풍선 표시
        setTimeout(() => {
            showSpeechBubble('다 드셨다니 입에 맞으셨나 보네요!', -1, true, showAfterMealSpeechSelection, null, '아무렴요', null);
        }, 500);
    }
}

// 식사 후 인사말 선택 단계 시작
function showAfterMealSpeechSelection() {
    // 말풍선 표시와 동시에 확장 및 버튼 표시
    const onStartCallback = () => {
        setTimeout(() => {
            expandSpeechBubbleForAfterMealSelection();
        }, 100); // 말풍선이 표시된 직후 실행
    };

    // 버튼 텍스트는 null로 설정하여 기본 버튼이 표시되지 않도록 함 (확장 함수에서 버튼 생성)
    showSpeechBubble('이런 때 보통, 해야 할 말이 있죠?', -1, false, null, onStartCallback, null, null);
}

// 식사 후 인사말 선택을 위한 말풍선 확장
function expandSpeechBubbleForAfterMealSelection() {
    const speechBubble = document.getElementById('speech-bubble');
    const speechBubbleContent = speechBubble ? speechBubble.querySelector('.speech-bubble-content') : null;
    const nextBtn = document.getElementById('next-speech-btn');

    if (!speechBubble || !speechBubbleContent) return;

    // 기존 버튼 숨기기
    if (nextBtn) {
        nextBtn.style.display = 'none';
    }

    // 기존 선택 버튼 컨테이너가 있으면 제거
    const existingSelectionContainer = speechBubbleContent.querySelector('.dish-selection-buttons');
    if (existingSelectionContainer) {
        existingSelectionContainer.remove();
    }

    // 말풍선 확장 (세로는 길게, 가로는 적당히)
    speechBubbleContent.style.transition = 'min-height 0.5s ease-in-out, max-width 0.5s ease-in-out, padding 0.5s ease-in-out';
    speechBubbleContent.style.minHeight = '500px';
    speechBubbleContent.style.maxWidth = '840px'; // 기존 너비 유지
    speechBubbleContent.style.padding = '40px 40px 40px 40px';

    // 버튼 컨테이너 생성
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'dish-selection-buttons';
    buttonsContainer.style.display = 'flex';
    buttonsContainer.style.flexDirection = 'column'; // 세로 배치
    buttonsContainer.style.justifyContent = 'center';
    buttonsContainer.style.gap = '20px';
    buttonsContainer.style.marginTop = '40px';
    buttonsContainer.style.width = '100%';
    buttonsContainer.style.position = 'relative';
    buttonsContainer.style.zIndex = '10011';

    // 버튼 데이터
    const buttonsData = [
        { text: '이타다키마스', value: 'wrong1' },
        { text: '고치소사마데시타', value: 'correct' }, // 정답 텍스트 수정 (이타다키마시타 -> 고치소사마데시타)
        { text: '오이시카타데스', value: 'wrong2' }
    ];

    buttonsData.forEach(data => {
        const button = document.createElement('button');
        button.className = 'next-btn';
        button.style.width = '100%'; // 가로 꽉 차게
        button.style.margin = '0';
        button.style.minHeight = '80px'; // 세로로 긴 버튼
        button.style.fontSize = '1.2rem';
        button.style.display = 'flex';
        button.style.alignItems = 'center';
        button.style.justifyContent = 'center';
        button.textContent = data.text;

        button.onclick = () => {
            handleAfterMealSpeechSelection(data.value);
        };

        buttonsContainer.appendChild(button);
    });

    // 버튼 컨테이너를 말풍선 안에 추가
    speechBubbleContent.appendChild(buttonsContainer);
}

// 식사 후 인사말 선택 처리
function handleAfterMealSpeechSelection(choice) {
    if (choice === 'correct') {
        // 정답 처리
        resetSpeechBubbleToDefault();

        // "별 말씀을요, 그릇 치워드릴까요?" 말풍선 표시
        showSpeechBubble('별 말씀을요, 그릇 치워드릴까요?', -1, true, () => {
            clearDishesAndComplete();
        }, null, '네', null);
    } else {
        // 오답 처리
        // 인포 메뉴 표시
        showAfterMealGreetingInfoMenu();

        const speechText = document.getElementById('speech-text');
        if (speechText) {
            speechText.textContent = '아닙니다. 다시 생각해보세요.';

            setTimeout(() => {
                speechText.textContent = '이런 때 보통, 해야 할 말이 있죠?';
            }, 1000);
        }
    }
}

// 식사 후 인사말 정보 메뉴 표시
function showAfterMealGreetingInfoMenu() {
    const infoMenu = document.getElementById('after-meal-greeting-info-menu');
    if (!infoMenu) return;

    // 오른쪽에서 왼쪽으로 등장하는 애니메이션
    infoMenu.style.display = 'block';
    infoMenu.style.top = '300px';
    infoMenu.style.right = '-25vw'; // 초기 위치 (화면 밖 오른쪽)

    // 애니메이션 시작
    setTimeout(() => {
        infoMenu.style.transition = 'right 0.5s ease-out';
        infoMenu.style.right = '20px';
    }, 50);
}

// 식사 후 인사말 정보 메뉴 닫기
function closeAfterMealGreetingInfoMenu() {
    const infoMenu = document.getElementById('after-meal-greeting-info-menu');
    if (!infoMenu) return;

    // 오른쪽으로 사라지는 애니메이션
    infoMenu.style.transition = 'right 0.5s ease-in';
    infoMenu.style.right = '-25vw';

    // 애니메이션 완료 후 숨김
    setTimeout(() => {
        infoMenu.style.display = 'none';
    }, 500);
}

// 확장된 말풍선을 기본 스타일로 되돌리는 함수
function resetSpeechBubbleToDefault() {
    const speechBubble = document.getElementById('speech-bubble');
    const speechBubbleContent = speechBubble ? speechBubble.querySelector('.speech-bubble-content') : null;
    const nextBtn = document.getElementById('next-speech-btn');

    if (!speechBubble || !speechBubbleContent) return;

    // 확장된 버튼 컨테이너 제거
    const existingSelectionContainer = speechBubbleContent.querySelector('.dish-selection-buttons');
    if (existingSelectionContainer) {
        existingSelectionContainer.remove();
    }

    // 말풍선 스타일을 기본값으로 되돌리기
    speechBubbleContent.style.transition = 'min-height 0.5s ease-in-out, max-width 0.5s ease-in-out, padding 0.5s ease-in-out';
    speechBubbleContent.style.minHeight = '';
    speechBubbleContent.style.maxWidth = '';
    speechBubbleContent.style.padding = '';

    // 다음 버튼 다시 표시 (기본 스타일)
    if (nextBtn) {
        nextBtn.style.display = 'block';
    }
}

// dish5와 dish2를 Finished 버전으로 변경하는 함수 (크로스페이드 애니메이션 적용)
function changeDishToFinished() {
    // dish5 요소 찾기
    const dish5Element = document.querySelector('.japan-dish-5');
    const dish5Img = dish5Element ? dish5Element.querySelector('img') : null;

    // dish2 요소 찾기 (soup-bowl-image)
    const dish2Element = document.querySelector('.soup-bowl-image');
    const dish2Img = dish2Element ? dish2Element.querySelector('img') : null;

    // dish5 이미지 변경 (크로스페이드: 기존 이미지 위에 새 이미지 겹쳐서 자연스럽게 전환)
    if (dish5Element && dish5Img) {
        // 기존 이미지의 모든 스타일 속성 복사
        const computedStyle = window.getComputedStyle(dish5Img);
        const imgRect = dish5Img.getBoundingClientRect();
        const elementRect = dish5Element.getBoundingClientRect();

        // dish5Element를 relative로 설정
        const currentPosition = window.getComputedStyle(dish5Element).position;
        if (currentPosition !== 'relative' && currentPosition !== 'absolute') {
            dish5Element.style.position = 'relative';
        }

        // 새 이미지 미리 로드
        const newDish5Img = new Image();
        newDish5Img.src = 'resource/jp/dish5Finished.png';

        newDish5Img.onload = function () {
            // 이미지가 로드된 후에만 크로스페이드 시작
            const newImgElement = document.createElement('img');
            newImgElement.src = 'resource/jp/dish5Finished.png';
            newImgElement.alt = 'dish 5 finished';

            // 기존 이미지와 정확히 동일한 크기와 위치 적용
            newImgElement.style.position = 'absolute';
            newImgElement.style.top = `${imgRect.top - elementRect.top}px`;
            newImgElement.style.left = `${imgRect.left - elementRect.left}px`;
            newImgElement.style.width = `${imgRect.width}px`;
            newImgElement.style.height = `${imgRect.height}px`;
            newImgElement.style.objectFit = computedStyle.objectFit || 'contain';
            newImgElement.style.opacity = '0';
            newImgElement.style.transition = 'opacity 0.6s ease-in-out';
            newImgElement.style.pointerEvents = 'none';
            newImgElement.style.zIndex = '1';
            newImgElement.style.display = computedStyle.display || 'block';

            // 기존 이미지 스타일 설정
            dish5Img.style.position = 'relative';
            dish5Img.style.zIndex = '0';
            dish5Img.style.transition = 'opacity 0.6s ease-in-out';

            // 새 이미지를 기존 이미지 위에 추가
            dish5Element.appendChild(newImgElement);

            // 크로스페이드 애니메이션 시작
            setTimeout(() => {
                dish5Img.style.opacity = '0';
                newImgElement.style.opacity = '1';
            }, 50);

            // 애니메이션 완료 후 기존 이미지 제거 (크기 유지)
            setTimeout(() => {
                dish5Img.remove();
                // 새 이미지의 크기와 위치를 유지한 채로 스타일 정리
                // width와 height는 유지하고, position만 정리
                newImgElement.style.position = '';
                newImgElement.style.top = '';
                newImgElement.style.left = '';
                newImgElement.style.objectFit = '';
                newImgElement.style.zIndex = '';
                // width와 height는 그대로 유지하여 크기 변화 방지
            }, 700);
        };
    }

    // dish2 이미지 변경 (크로스페이드: 기존 이미지 위에 새 이미지 겹쳐서 자연스럽게 전환)
    if (dish2Element && dish2Img) {
        // 약간의 지연을 주어 dish5와 순차적으로 애니메이션
        setTimeout(() => {
            // 기존 이미지의 모든 스타일 속성 복사
            const computedStyle = window.getComputedStyle(dish2Img);
            const imgRect = dish2Img.getBoundingClientRect();
            const elementRect = dish2Element.getBoundingClientRect();

            // dish2Element를 relative로 설정
            const currentPosition = window.getComputedStyle(dish2Element).position;
            if (currentPosition !== 'relative' && currentPosition !== 'absolute') {
                dish2Element.style.position = 'relative';
            }

            // 새 이미지 미리 로드
            const newDish2Img = new Image();
            newDish2Img.src = 'resource/jp/dish2Finished.png';

            newDish2Img.onload = function () {
                // 이미지가 로드된 후에만 크로스페이드 시작
                const newImgElement = document.createElement('img');
                newImgElement.src = 'resource/jp/dish2Finished.png';
                newImgElement.alt = '국그릇 finished';

                // 기존 이미지와 정확히 동일한 크기와 위치 적용
                newImgElement.style.position = 'absolute';
                newImgElement.style.top = `${imgRect.top - elementRect.top}px`;
                newImgElement.style.left = `${imgRect.left - elementRect.left}px`;
                newImgElement.style.width = `${imgRect.width}px`;
                newImgElement.style.height = `${imgRect.height}px`;
                newImgElement.style.objectFit = computedStyle.objectFit || 'contain';
                newImgElement.style.opacity = '0';
                newImgElement.style.transition = 'opacity 0.6s ease-in-out';
                newImgElement.style.pointerEvents = 'none';
                newImgElement.style.zIndex = '1';
                newImgElement.style.display = computedStyle.display || 'block';

                // 기존 이미지 스타일 설정
                dish2Img.style.position = 'relative';
                dish2Img.style.zIndex = '0';
                dish2Img.style.transition = 'opacity 0.6s ease-in-out';

                // 새 이미지를 기존 이미지 위에 추가
                dish2Element.appendChild(newImgElement);

                // 크로스페이드 애니메이션 시작
                setTimeout(() => {
                    dish2Img.style.opacity = '0';
                    newImgElement.style.opacity = '1';
                }, 50);

                // 애니메이션 완료 후 기존 이미지 제거 (크기 유지)
                setTimeout(() => {
                    dish2Img.remove();
                    // 새 이미지의 크기와 위치를 유지한 채로 스타일 정리
                    // width와 height는 유지하고, position만 정리
                    newImgElement.style.position = '';
                    newImgElement.style.top = '';
                    newImgElement.style.left = '';
                    newImgElement.style.objectFit = '';
                    newImgElement.style.zIndex = '';
                    // width와 height는 그대로 유지하여 크기 변화 방지
                }, 700);
            };
        }, 200); // 0.2초 지연
    }
}

// 계산서가 셰프테이블에서 아래로 내려오는 함수
function showBillFromCheftable() {
    const tableSetting = document.querySelector('.table-setting');
    const topCheftable = document.querySelector('.top-cheftable');

    if (!tableSetting || !topCheftable) return;

    // 이미 계산서가 있으면 리턴
    if (document.querySelector('.cheftable-bill')) return;

    // 계산서 이미지 생성
    const bill = document.createElement('div');
    bill.className = 'cheftable-bill';
    bill.style.position = 'absolute';
    bill.style.zIndex = '100'; // 다른 요소들보다 위에 표시

    const img = document.createElement('img');
    img.src = 'resource/jp/bill.png';
    img.style.display = 'block';

    // 이미지가 로드된 후 위치 설정 및 애니메이션 시작
    const setupPositionAndAnimate = () => {
        // 이미지 크기 설정 - vw 단위 (적절히 조절)
        const naturalWidth = img.naturalWidth;
        const naturalHeight = img.naturalHeight;
        const scaledWidth = naturalWidth * 0.4; // 밥그릇보다 훨씬 작게
        const scaledHeight = naturalHeight * 0.4;
        img.style.width = `${pxToVw(scaledWidth)}vw`;
        img.style.height = `${pxToVw(scaledHeight)}vw`;

        // 초기 위치 (애니메이션 시작 위치) - vw 단위
        const startTop = -12.7 - 5; // 최종 위치보다 조금 위에서 시작
        const centerLeft = 69.4; // 밥그릇과 같은 위치 (또는 조정 가능)

        // 최종 위치 - vw 단위
        const endTop = -12.7;

        bill.style.left = `${centerLeft}vw`;
        bill.style.top = `${startTop}vw`;
        bill.style.transform = 'translate(-50%, 0)';
        bill.style.opacity = '0';
        bill.style.transition = 'opacity 0.5s ease-in, top 1s ease-out';

        // 하이라이트 효과 추가
        bill.classList.add('highlight-pulse');

        // 나타나는 애니메이션 (아래로 내려오기)
        setTimeout(() => {
            bill.style.opacity = '1';
            bill.style.top = `${endTop}vw`;
        }, 50);
    };

    img.onload = setupPositionAndAnimate;

    if (img.complete) {
        setupPositionAndAnimate();
    }

    bill.appendChild(img);
    tableSetting.appendChild(bill);

    // 클릭 이벤트 추가
    bill.style.cursor = 'pointer';
    bill.onclick = () => {
        bill.style.display = 'none'; // bill1 숨기기
        showBillDetail();
    };
}

// 상세 계산서 표시 함수
function showBillDetail() {
    const tableSetting = document.querySelector('.table-setting');
    if (!tableSetting) return;

    // 이미 상세 계산서가 있으면 리턴
    if (document.querySelector('.bill-detail')) return;

    // 상세 계산서 컨테이너 생성
    const billDetail = document.createElement('div');
    billDetail.className = 'bill-detail';
    billDetail.style.position = 'absolute';
    billDetail.style.zIndex = '20000'; // 최상위 표시
    billDetail.style.left = '55%'; // 약간 오른쪽으로 이동
    billDetail.style.top = '50%';
    billDetail.style.transform = 'translate(-50%, -50%) scale(0.5)';
    billDetail.style.opacity = '0';
    billDetail.style.transition = 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'; // 팝업 효과
    // 텍스트 배치를 위한 폰트 설정
    billDetail.style.fontFamily = "'Courier New', Courier, monospace"; // 영수증 느낌 폰트
    billDetail.style.color = '#333';
    billDetail.style.textAlign = 'center';

    const img = document.createElement('img');
    img.src = 'resource/jp/bill2.png';
    img.style.display = 'block';

    // 이미지 크기 설정 (적절한 크기로)
    img.onload = () => {
        const naturalWidth = img.naturalWidth;
        const naturalHeight = img.naturalHeight;
        // 화면 너비의 약 25% 정도 차지하도록 설정 (사이즈 줄임)
        const targetWidthVw = 25;
        const scale = targetWidthVw / pxToVw(naturalWidth);

        img.style.width = `${targetWidthVw}vw`;
        img.style.height = `${pxToVw(naturalHeight * scale)}vw`;

        // 애니메이션 시작
        setTimeout(() => {
            billDetail.style.opacity = '1';
            billDetail.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 50);
    };

    billDetail.appendChild(img);

    // 영수증 내용 추가 (텍스트 및 선)
    const contentContainer = document.createElement('div');
    contentContainer.style.position = 'absolute';
    contentContainer.style.top = '15%';
    contentContainer.style.left = '20%'; // 왼쪽 마진 증가
    contentContainer.style.width = '65%'; // 너비 조정
    contentContainer.style.height = 'auto'; // 높이 자동
    contentContainer.style.display = 'flex';
    contentContainer.style.flexDirection = 'column';
    contentContainer.style.alignItems = 'center';
    contentContainer.style.pointerEvents = 'none'; // 클릭 통과

    // 제목
    const title = document.createElement('div');
    title.textContent = 'RECEIPT';
    title.style.fontSize = '1.5vw';
    title.style.fontWeight = 'bold';
    title.style.marginBottom = '1vw';
    contentContainer.appendChild(title);

    // 구분선 1
    const line1 = document.createElement('div');
    line1.style.width = '100%';
    line1.style.borderBottom = '0.2vw dashed #333';
    line1.style.marginBottom = '1.5vw';
    contentContainer.appendChild(line1);

    // 메뉴 아이템 생성 함수
    const createItemRow = (name, price) => {
        const row = document.createElement('div');
        row.style.width = '100%';
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.marginBottom = '0.5vw';
        row.style.fontSize = '1.2vw';

        const nameSpan = document.createElement('span');
        nameSpan.textContent = name;
        const priceSpan = document.createElement('span');
        priceSpan.textContent = price;

        row.appendChild(nameSpan);
        row.appendChild(priceSpan);
        return row;
    };

    // 메뉴 아이템들 추가
    contentContainer.appendChild(createItemRow('Gyudon Set', '¥1,200'));
    contentContainer.appendChild(createItemRow('Water', '¥100'));
    contentContainer.appendChild(createItemRow('Tax', '¥130'));

    // 구분선 2
    const line2 = document.createElement('div');
    line2.style.width = '100%';
    line2.style.borderBottom = '0.2vw dashed #333';
    line2.style.marginTop = '2vw'; // 위로 올리기 위해 auto 제거하고 고정값 사용
    line2.style.marginBottom = '1vw';
    contentContainer.appendChild(line2);

    // 총계
    const totalRow = document.createElement('div');
    totalRow.style.width = '100%';
    totalRow.style.display = 'flex';
    totalRow.style.justifyContent = 'space-between';
    totalRow.style.fontSize = '1.5vw';
    totalRow.style.fontWeight = 'bold';

    const totalLabel = document.createElement('span');
    totalLabel.textContent = 'TOTAL';
    const totalPrice = document.createElement('span');
    totalPrice.textContent = '¥1,430';

    totalRow.appendChild(totalLabel);
    totalRow.appendChild(totalPrice);
    contentContainer.appendChild(totalRow);

    billDetail.appendChild(contentContainer);
    tableSetting.appendChild(billDetail);

    // 배경 클릭 시 닫기 (선택 사항)
    const closeHandler = (e) => {
        // 결제가 완료된 경우 닫기 핸들러 무시
        if (billDetail.dataset.paymentComplete === 'true') {
            document.removeEventListener('click', closeHandler);
            return;
        }

        // 말풍선(버튼 포함)을 클릭했을 때는 닫히지 않도록 예외 처리
        if (e.target.closest('#speech-bubble')) {
            return;
        }

        if (!billDetail.contains(e.target) && e.target !== billDetail) {
            billDetail.style.opacity = '0';
            billDetail.style.transform = 'translate(-50%, -50%) scale(0.5)';

            // bill1 다시 표시
            const bill1 = document.querySelector('.cheftable-bill');
            if (bill1) {
                bill1.style.display = 'block';
            }

            // 말풍선 초기화 (결제 선택 버튼 제거)
            resetSpeechBubbleToDefault();
            showSpeechBubble('계산 도와드릴게요', -1, false, null, null, null, null);

            setTimeout(() => {
                billDetail.remove();
                document.removeEventListener('click', closeHandler);
            }, 500);
        }
    };

    // 약간의 지연 후 클릭 이벤트 리스너 추가 (즉시 닫힘 방지)
    setTimeout(() => {
        document.addEventListener('click', closeHandler);
    }, 100);

    // 결제 수단 선택 말풍선 표시 (애니메이션 완료 후)
    setTimeout(() => {
        expandSpeechBubbleForPaymentSelection();
    }, 600);
}

// 결제 수단 선택을 위한 말풍선 확장
function expandSpeechBubbleForPaymentSelection() {
    const speechBubble = document.getElementById('speech-bubble');
    const speechBubbleContent = speechBubble ? speechBubble.querySelector('.speech-bubble-content') : null;
    const speechText = document.getElementById('speech-text');
    const nextBtn = document.getElementById('next-speech-btn');

    if (!speechBubble || !speechBubbleContent) return;

    // 텍스트 변경
    if (speechText) {
        speechText.textContent = '결제는 어떻게 하시겠습니까?';
    }

    // 기존 버튼 숨기기
    if (nextBtn) {
        nextBtn.style.display = 'none';
    }

    // 기존 선택 버튼 컨테이너가 있으면 제거
    const existingSelectionContainer = speechBubbleContent.querySelector('.dish-selection-buttons');
    if (existingSelectionContainer) {
        existingSelectionContainer.remove();
    }

    // 말풍선 확장 (세로는 길게, 가로는 적당히)
    speechBubbleContent.style.transition = 'min-height 0.5s ease-in-out, max-width 0.5s ease-in-out, padding 0.5s ease-in-out';
    speechBubbleContent.style.minHeight = '480px';
    speechBubbleContent.style.maxWidth = '1280px';
    speechBubbleContent.style.padding = '40px 40px 120px 40px';

    // 버튼 컨테이너 생성
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'dish-selection-buttons';
    buttonsContainer.style.display = 'flex';
    buttonsContainer.style.flexDirection = 'row'; // 가로 배치
    buttonsContainer.style.justifyContent = 'space-between';
    buttonsContainer.style.gap = '40px';
    buttonsContainer.style.marginTop = '40px';
    buttonsContainer.style.width = '100%';
    buttonsContainer.style.position = 'relative';
    buttonsContainer.style.zIndex = '10011';

    // 좌측 버튼: 카드로 계산
    const leftButton = document.createElement('button');
    leftButton.className = 'next-btn';
    leftButton.style.flex = '1';
    leftButton.style.margin = '0';
    leftButton.style.minWidth = '280px';
    leftButton.style.minHeight = '320px';
    leftButton.style.display = 'flex';
    leftButton.style.flexDirection = 'column';
    leftButton.style.alignItems = 'center';
    leftButton.style.justifyContent = 'center';
    leftButton.style.gap = '16px';
    leftButton.style.padding = '24px';
    leftButton.style.position = 'relative';
    leftButton.style.zIndex = '10012';

    // 이미지 컨테이너 (나중에 이미지 추가 예정)
    const leftImageContainer = document.createElement('div');
    leftImageContainer.style.width = '200px';
    leftImageContainer.style.height = '200px';
    leftImageContainer.style.backgroundColor = 'transparent'; // 투명 배경
    leftImageContainer.style.display = 'flex';
    leftImageContainer.style.alignItems = 'center';
    leftImageContainer.style.justifyContent = 'center';
    // 여기에 카드 이미지 추가 가능
    leftButton.appendChild(leftImageContainer);

    // 텍스트
    const leftText = document.createElement('span');
    leftText.textContent = '카드로 계산';
    leftText.style.fontSize = '19px';
    leftText.style.whiteSpace = 'nowrap';
    leftButton.appendChild(leftText);

    leftButton.onclick = () => {
        handlePaymentSelection('card');
    };
    buttonsContainer.appendChild(leftButton);

    // 우측 버튼: 현금으로 계산
    const rightButton = document.createElement('button');
    rightButton.className = 'next-btn';
    rightButton.style.flex = '1';
    rightButton.style.margin = '0';
    rightButton.style.minWidth = '280px';
    rightButton.style.minHeight = '320px';
    rightButton.style.display = 'flex';
    rightButton.style.flexDirection = 'column';
    rightButton.style.alignItems = 'center';
    rightButton.style.justifyContent = 'center';
    rightButton.style.gap = '16px';
    rightButton.style.padding = '24px';
    rightButton.style.position = 'relative';
    rightButton.style.zIndex = '10012';

    // 이미지 컨테이너 (나중에 이미지 추가 예정)
    const rightImageContainer = document.createElement('div');
    rightImageContainer.style.width = '200px';
    rightImageContainer.style.height = '200px';
    rightImageContainer.style.backgroundColor = 'transparent'; // 투명 배경
    rightImageContainer.style.display = 'flex';
    rightImageContainer.style.alignItems = 'center';
    rightImageContainer.style.justifyContent = 'center';
    // 여기에 현금 이미지 추가 가능
    rightButton.appendChild(rightImageContainer);

    // 텍스트
    const rightText = document.createElement('span');
    rightText.textContent = '현금으로 계산';
    rightText.style.fontSize = '19px';
    rightText.style.whiteSpace = 'nowrap';
    rightButton.appendChild(rightText);

    rightButton.onclick = () => {
        handlePaymentSelection('cash');
    };
    buttonsContainer.appendChild(rightButton);

    // 버튼 컨테이너를 말풍선 안에 추가
    speechBubbleContent.appendChild(buttonsContainer);
}

// 결제 수단 선택 처리
function handlePaymentSelection(choice) {
    // 공통: 인포 메뉴 표시
    showPaymentInfoMenu();

    if (choice === 'card') {
        // 카드로 계산 시: 거절 메시지 및 진행 불가
        const speechText = document.getElementById('speech-text');
        if (speechText) {
            speechText.textContent = '죄송하지만 저희는 현금만 받고 있어요.';
        }
    } else if (choice === 'cash') {
        // 현금으로 계산 시: 감사 메시지 및 완료 처리
        resetSpeechBubbleToDefault();
        showSpeechBubble('감사합니다.', 3000);

        // 계산서 숨기기
        const billDetail = document.querySelector('.bill-detail');
        if (billDetail) {
            billDetail.dataset.paymentComplete = 'true'; // 결제 완료 플래그 설정
            billDetail.style.opacity = '0';
            setTimeout(() => {
                billDetail.remove();
            }, 500);
        }

        const bill1 = document.querySelector('.cheftable-bill');
        if (bill1) {
            bill1.style.display = 'none';
        }

        // 여기에 스테이지 완료 로직 추가 가능
        setTimeout(() => {
            showStageClearEffect('japan');
        }, 1500);
    }
}

// 스테이지 클리어 효과 표시
function showStageClearEffect(stage) {
    // 스탬프 업데이트
    if (stage === 'japan') {
        japanCompleted = true;
        updateStamp('japan');
    } else if (stage === 'china') {
        chinaCompleted = true;
        updateStamp('china');
    }

    // 클리어 오버레이 생성
    const overlay = document.createElement('div');
    overlay.className = 'stage-clear-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '30000';
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 1s ease-in-out';

    // 클리어 텍스트
    const clearText = document.createElement('div');
    clearText.textContent = 'STAGE CLEAR!';
    clearText.style.color = '#fff';
    clearText.style.fontSize = '5rem';
    clearText.style.fontWeight = 'bold';
    clearText.style.marginBottom = '2rem';
    clearText.style.textShadow = '0 0 20px rgba(255, 215, 0, 0.8)';
    clearText.style.transform = 'scale(0.5)';
    clearText.style.transition = 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    overlay.appendChild(clearText);

    // 지도로 돌아가기 버튼 생성
    const backToMapBtn = document.createElement('button');
    backToMapBtn.textContent = '지도로 돌아가기';
    backToMapBtn.style.padding = '15px 40px';
    backToMapBtn.style.fontSize = '1.5rem';
    backToMapBtn.style.fontWeight = 'bold';
    backToMapBtn.style.color = '#fff';
    backToMapBtn.style.backgroundColor = '#B56B41';
    backToMapBtn.style.border = 'none';
    backToMapBtn.style.borderRadius = '15px';
    backToMapBtn.style.cursor = 'pointer';
    backToMapBtn.style.marginTop = '2rem';
    backToMapBtn.style.opacity = '0';
    backToMapBtn.style.transform = 'translateY(20px)';
    backToMapBtn.style.transition = 'all 0.5s ease-in-out 1s';
    backToMapBtn.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
    backToMapBtn.style.fontFamily = "'강원교육모두', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
    
    // 버튼 호버 효과
    backToMapBtn.addEventListener('mouseenter', () => {
        backToMapBtn.style.backgroundColor = '#905431';
        backToMapBtn.style.transform = 'translateY(0) scale(1.05)';
    });
    backToMapBtn.addEventListener('mouseleave', () => {
        backToMapBtn.style.backgroundColor = '#B56B41';
        backToMapBtn.style.transform = 'translateY(0) scale(1)';
    });
    
    // 버튼 클릭 이벤트
    backToMapBtn.onclick = () => {
        overlay.style.transition = 'opacity 0.5s ease-in-out';
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.remove();
            // map-screen이 현재 페이지에 있는지 확인
            const mapScreen = document.getElementById('map-screen');
            if (mapScreen) {
                showScreen('map');
            } else {
                // map-screen이 없으면 index.html로 이동
                window.location.href = 'index.html?screen=map';
            }
        }, 500);
    };
    
    overlay.appendChild(backToMapBtn);
    
    // 기존 지도 돌아가기 버튼이 있으면 강조 (있는 경우)
    const backBtnId = stage === 'japan' ? 'back-to-map-japan' : 'back-to-map-china';
    const backBtn = document.getElementById(backBtnId);
    
    if (backBtn) {
        backBtn.style.position = 'relative';
        backBtn.style.zIndex = '30001';
        backBtn.classList.add('highlight-pulse');
        
        // 기존 버튼 클릭 시에도 오버레이 제거
        const originalOnClick = backBtn.onclick;
        backBtn.onclick = (e) => {
            backBtn.classList.remove('highlight-pulse');
            backBtn.style.zIndex = '';
            overlay.style.transition = 'opacity 0.5s ease-in-out';
            overlay.style.opacity = '0';
            setTimeout(() => {
            overlay.remove();
            }, 500);
            // map-screen이 현재 페이지에 있는지 확인
            const mapScreen = document.getElementById('map-screen');
            if (mapScreen) {
            if (originalOnClick) originalOnClick(e);
                else showScreen('map');
            } else {
                // map-screen이 없으면 index.html로 이동
                window.location.href = 'index.html?screen=map';
            }
        };
    }

    document.body.appendChild(overlay);

    // 애니메이션 시작
    setTimeout(() => {
        overlay.style.opacity = '1';
        clearText.style.transform = 'scale(1)';
        // 버튼 나타나기
        backToMapBtn.style.opacity = '1';
        backToMapBtn.style.transform = 'translateY(0)';
    }, 100);
}

// 결제 정보 메뉴 표시 함수
function showPaymentInfoMenu() {
    const infoMenu = document.getElementById('payment-info-menu');
    if (!infoMenu) return;

    // 오른쪽에서 왼쪽으로 등장하는 애니메이션
    infoMenu.style.display = 'block';
    infoMenu.style.top = '300px';
    infoMenu.style.right = '-25vw'; // 초기 위치 (화면 밖 오른쪽)

    // 애니메이션 시작
    setTimeout(() => {
        infoMenu.style.transition = 'right 0.5s ease-out';
        infoMenu.style.right = '20px';
    }, 50);
}

// 결제 정보 메뉴 닫기 함수
function closePaymentInfoMenu() {
    const infoMenu = document.getElementById('payment-info-menu');
    if (!infoMenu) return;

    // 오른쪽으로 사라지는 애니메이션
    infoMenu.style.transition = 'right 0.5s ease-in';
    infoMenu.style.right = '-25vw';

    // 애니메이션 완료 후 숨김
    setTimeout(() => {
        infoMenu.style.display = 'none';
    }, 500);
}

// 그릇 정리 및 완료 처리
function clearDishesAndComplete() {
    // 말풍선 숨기기
    hideSpeechBubble();

    // 사라질 요소 선택자 목록 (dish3, dish4, 수저는 제외)
    const selectorsToHide = [
        '#drop-rice-bowl', // 밥그릇 (드롭존 포함)
        '.soup-bowl-image', // 국그릇
        '.japan-dish-5', // 반찬 5
        '.shadow-dish', // 밥그릇 그림자
        '.shadow-dish2', // 국그릇 그림자
        '.shadow-dish5' // 반찬 5 그림자
    ];

    // 요소들 애니메이션 적용하여 숨기기
    selectorsToHide.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            // 현재 transform 값을 유지하면서 이동
            const computedStyle = window.getComputedStyle(el);

            el.style.transition = 'opacity 1s ease-out, transform 1s ease-out';
            el.style.opacity = '0';

            // 상단으로 이동하며 사라짐
            // 그림자 요소들은 transform으로 위치가 잡혀있으므로, translateY를 추가하여 이동
            if (el.classList.contains('image-shadow')) {
                // computedStyle.transform은 matrix(...)를 반환함.
                // 여기에 translateY를 추가하면 현재 위치 기준에서 이동함.
                const currentTransform = computedStyle.transform !== 'none' ? computedStyle.transform : '';
                el.style.transform = `${currentTransform} translateY(-100px)`;
            } else {
                // 다른 요소들은 단순히 translateY(-100px) 적용
                el.style.transform = 'translateY(-100px)';
            }

            // 애니메이션 완료 후 display: none 처리
            setTimeout(() => {
                el.style.display = 'none';
            }, 1000);
        });
    });

    // 계산하기 단계로 전환
    setPhase('japan', GAME_PHASE.CALCULATION);

    // 계산서 등장 및 말풍선 표시
    setTimeout(() => {
        showSpeechBubble('계산 도와드릴게요', -1, false, null, null, null, null);
        showBillFromCheftable();
    }, 1500);
}

// 디버그 모드 변수
let debugMode = false;
let selectedDebugElement = null;
let debugPositions = {};

// 기본 디버그 위치 (GitHub에 업로드될 기본값)
// localStorage에 값이 없을 때 이 값들이 사용됩니다.
// 현재 localStorage 값을 이 변수로 업데이트하려면 exportDebugPositionsToCode() 함수를 사용하세요.
const defaultDebugPositions = {
    "china-table-1": {
        "left": -15.807962376198443,
        "top": -177.25490894192964
    },
    "cn-rice": {
        "x": 36.6231288981289,
        "y": 65.56029106029106,
        "size": 77.83783783783782,
        "rotation": 0
    },
    "cn-spoon": {
        "x": 56.181392931392935,
        "y": 60.87110187110187,
        "size": 4.1621569646569645,
        "rotation": 0
    },
    "cn-chopstick": {
        "x": 40.1,
        "y": 30.3,
        "size": 16,
        "rotation": 0
    },
    "cn-dish": {
        "x": 19,
        "y": 25.2,
        "size": 12.3,
        "rotation": 0
    },
    "cn-dish2": {
        "x": 31.3,
        "y": 25.2,
        "size": 12.3,
        "rotation": 0
    },
    "cn-tavlemat": {
        "x": 0,
        "y": 0,
        "size": 61.3,
        "rotation": 0
    },
    "cn-teapot": {
        "x": 59.1,
        "y": 29.0,
        "size": 14.3,
        "rotation": 0
    },
    "cn-cup": {
        "x": 50.1,
        "y": 33.0,
        "size": 7,
        "rotation": 0
    },
    "cn-chopstick2": {
        "x": 36.4,
        "y": 30.3,
        "size": 16,
        "rotation": 0
    },
    "cn-chopstickspot": {
        "x": 39.4,
        "y": 32.7,
        "size": 3.4,
        "rotation": 0
    },
    "card-napkin-japan": {
        "x": 84.18187066974596,
        "y": 33.592667436489606,
        "size": 4.17,
        "rotation": -5
    },
    "drop-zone-chopsticks-japan": {
        "x": -147.17515592515593,
        "y": 19.983160083160083,
        "size": 4.17,
        "rotation": 0
    },
    "hand-japan": {
        "x": 3.9991281755196306,
        "y": 21.895207852193995,
        "size": 16.919053117782912,
        "rotation": 0
    },
    "cheftable-japan": {
        "x": 14.000207900207897,
        "y": -8.80010395010395,
        "size": 89.31029106029106,
        "rotation": 0
    },
    "cn-table1": {
        "x": 33.8,
        "y": -29.5,
        "size": 54.9,
        "rotation": 0
    },
    "cn-maindish1": {
        "x": 0,
        "y": 0,
        "size": 14,
        "rotation": 0
    },
    "cn-maindish2": {
        "x": 0,
        "y": 0,
        "size": 15.8,
        "rotation": 0
    },
    "cn-maindish3": {
        "x": 0,
        "y": 0,
        "size": 18.1,
        "rotation": 0
    },
    "cn-maindish4": {
        "x": 0,
        "y": 0,
        "size": 12,
        "rotation": 0
    },
    "cn-maindish5": {
        "x": 0,
        "y": 0,
        "size": 11.7,
        "rotation": 0
    },
    "cn-maindish6": {
        "x": 0,
        "y": 0,
        "size": 10,
        "rotation": 0
    },
    "cn-mandu": {
        "x": 0,
        "y": 0,
        "size": 3.4,
        "rotation": 0
    },
    "cn-mandu2": {
        "x": 0,
        "y": 0,
        "size": 3.4,
        "rotation": 0
    },
    "cn-table2": {
        "x": 0,
        "y": 0,
        "size": 4.1621569646569645,
        "rotation": 0
    },
    "hand-china": {
        "x": 1.0378274428274428,
        "y": 0,
        "size": 4.1621569646569645,
        "rotation": 0
    },
    "japan-dish-5": {
        "x": 5.097848232848233,
        "y": 9.396101871101871,
        "size": 29.814553014553013,
        "rotation": 0
    },
    "japan-dish-3": {
        "x": 39.691859122401844,
        "y": 9.395323325635104,
        "size": 10.797055427251733,
        "rotation": 0
    },
    "japan-dish-4": {
        "x": 63.386258660508076,
        "y": 8.696189376443417,
        "size": 8.490588914549653,
        "rotation": 0
    },
    "dropped-chopsticks-japan": {
        "x": 0,
        "y": 0,
        "size": 4.17,
        "rotation": 0
    },
    "soup-bowl-japan": {
        "x": 38.991512702078516,
        "y": 27.68827944572748,
        "size": 15.383833718244802,
        "rotation": 0
    },
    "drop-zone-rice-bowl-japan": {
        "x": 51.68874133949192,
        "y": 29.693533487297923,
        "size": 21.399653579676674,
        "rotation": 0
    },
    "drop-zone-spoon-japan": {
        "x": 63.98614318706698,
        "y": 31.893071593533488,
        "size": 4.16521362586605,
        "rotation": 0
    },
    "drop-zone-chopsticks-2-japan": {
        "x": 49.98908775981524,
        "y": 31.59757505773672,
        "size": 4.168481524249422,
        "rotation": -90
    },
    "cheftable-rice-bowl-japan": {
        "x": 69.68475750577367,
        "y": -12.697228637413394,
        "size": 22.950346420323324,
        "rotation": 0
    },
    "spoonspot-image": {
        "x": 55.0141041931385,
        "y": 24.706353240152477,
        "size": 5.300266836086403,
        "rotation": 0
    },
    "spoonspot-2": {
        "x": 38.291628175519634,
        "y": 43.59670900692841,
        "size": 4.99858545034642,
        "rotation": -90
    },
    "shadow-dish5": {
        "x": 6.7984988452655895,
        "y": 4.399041570438799,
        "size": 29.806870669745962,
        "rotation": 0
    },
    "spoonspot-1": {
        "x": 63.386258660508076,
        "y": 24.701270207852193,
        "size": 5.29843533487298,
        "rotation": 0
    },
    "shadow-dish2": {
        "x": 24.9945727482679,
        "y": 15.396651270207853,
        "size": 15.378926096997692,
        "rotation": 0
    },
    "shadow-dish3": {
        "x": 41.990819861431866,
        "y": 4.199087759815242,
        "size": 11.09688221709007,
        "rotation": 0
    },
    "shadow-dish4": {
        "x": 65.18591224018475,
        "y": 3.899151270207852,
        "size": 8.489722863741338,
        "rotation": 0
    },
    "shadow-dish": {
        "x": 39.59139722863741,
        "y": 16.09647806004619,
        "size": 21.5074480369515,
        "rotation": 0
    },
    "shadow-spoon": {
        "x": 65.98556581986142,
        "y": 15.396651270207853,
        "size": 4.346593533487298,
        "rotation": 0
    },
    "shadow-chopsticks": {
        "x": 42.990646651270204,
        "y": 30.6933025404157,
        "size": 3.6962413394919174,
        "rotation": -90
    }
};

// 디버그 모드 초기화
function initializeDebugMode() {
    console.log('Initializing Debug Mode...');

    // 요소를 찾을 때까지 재시도
    const findElements = () => {
        const debugToggleBtn = document.getElementById('debug-toggle-btn');
        const debugPanel = document.getElementById('debug-panel');
        const closeDebugBtn = document.getElementById('close-debug');

        if (!debugToggleBtn || !debugPanel) {
            console.warn('Debug mode elements not found, retrying...');
            setTimeout(findElements, 100);
            return;
        }

        console.log('Debug mode elements found!');

        const debugXSlider = document.getElementById('debug-x-slider');
        const debugYSlider = document.getElementById('debug-y-slider');
        const debugSizeSlider = document.getElementById('debug-size-slider');
        const debugRotationSlider = document.getElementById('debug-rotation-slider');
        const debugXValue = document.getElementById('debug-x-value');
        const debugYValue = document.getElementById('debug-y-value');
        const debugSizeValue = document.getElementById('debug-size-value');
        const debugRotationValue = document.getElementById('debug-rotation-value');
        const debugSaveBtn = document.getElementById('debug-save-btn');
        const debugSaveAllBtn = document.getElementById('debug-save-all-btn');
        const debugResetBtn = document.getElementById('debug-reset-btn');
        const debugExportBtn = document.getElementById('debug-export-btn');

        // 저장된 위치 불러오기
        loadDebugPositions();

        // 기존 이벤트 리스너 제거 (중복 방지)
        const newDebugToggleBtn = debugToggleBtn.cloneNode(true);
        debugToggleBtn.parentNode.replaceChild(newDebugToggleBtn, debugToggleBtn);

        // 디버그 모드 토글
        newDebugToggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Debug toggle clicked');
            debugMode = !debugMode;
            if (debugMode) {
                document.body.classList.add('debug-mode');
                debugPanel.style.display = 'block';
                console.log('Debug mode ON');
            } else {
                document.body.classList.remove('debug-mode');
                debugPanel.style.display = 'none';
                selectedDebugElement = null;
                updateDebugPanel();
                console.log('Debug mode OFF');
            }
        });

        // 디버그 패널 닫기
        if (closeDebugBtn) {
            closeDebugBtn.addEventListener('click', () => {
                debugMode = false;
                document.body.classList.remove('debug-mode');
                debugPanel.style.display = 'none';
                selectedDebugElement = null;
                updateDebugPanel();
            });
        }

        // 이미지 클릭 이벤트 (디버그 모드에서만)
        document.addEventListener('click', (e) => {
            if (!debugMode) return;

            // 클릭된 요소가 이미지인 경우 부모 요소 찾기
            let target = e.target;

            // 이미지가 클릭된 경우 부모 요소 찾기
            if (target.tagName === 'IMG') {
                target = target.closest('.china-utensil, .china-table-image-1, .china-table-image, .soup-bowl-image, .spoonspot-image, .hand-draggable, .top-cheftable, .card-napkin, .dropped-item, .cheftable-rice-bowl, #grab-image, .drop-zone, .japan-dish-3, .japan-dish-4, .japan-dish-5, .image-shadow, .setting-spoon, .setting-chopsticks, .setting-bowl, .setting-plate, .setting-tea-pot, .setting-tea-cup, .setting-mat');
            } else {
                target = target.closest('.china-utensil, .china-table-image-1, .china-table-image, .soup-bowl-image, .spoonspot-image, .hand-draggable, .top-cheftable, .card-napkin, .dropped-item, .cheftable-rice-bowl, #grab-image, .drop-zone, .japan-dish-3, .japan-dish-4, .japan-dish-5, .image-shadow, .setting-spoon, .setting-chopsticks, .setting-bowl, .setting-plate, .setting-tea-pot, .setting-tea-cup, .setting-mat');
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
        // X 좌표 슬라이더 이벤트
        debugXSlider.addEventListener('input', (e) => {
            if (!selectedDebugElement) return;
            const value = parseFloat(e.target.value);
            debugXValue.value = value.toFixed(1);
            updateElementPosition(selectedDebugElement, value, null);
        });

        // X 좌표 입력 필드 이벤트
        debugXValue.addEventListener('input', (e) => {
            if (!selectedDebugElement) return;
            const value = parseFloat(e.target.value);
            if (!isNaN(value)) {
                // 슬라이더 범위를 동적으로 조정
                const sliderMin = parseFloat(debugXSlider.min);
                const sliderMax = parseFloat(debugXSlider.max);
                if (value < sliderMin) {
                    debugXSlider.min = (value - 100).toString();
                } else if (value > sliderMax) {
                    debugXSlider.max = (value + 100).toString();
                }
                debugXSlider.value = value;
                e.target.value = value.toFixed(1);
                updateElementPosition(selectedDebugElement, value, null);
            }
        });

        // Y 좌표 슬라이더 이벤트
        debugYSlider.addEventListener('input', (e) => {
            if (!selectedDebugElement) return;
            const value = parseFloat(e.target.value);
            debugYValue.value = value.toFixed(1);
            updateElementPosition(selectedDebugElement, null, value);
        });

        // Y 좌표 입력 필드 이벤트
        debugYValue.addEventListener('input', (e) => {
            if (!selectedDebugElement) return;
            const value = parseFloat(e.target.value);
            if (!isNaN(value)) {
                // 슬라이더 범위를 동적으로 조정
                const sliderMin = parseFloat(debugYSlider.min);
                const sliderMax = parseFloat(debugYSlider.max);
                if (value < sliderMin) {
                    debugYSlider.min = (value - 100).toString();
                } else if (value > sliderMax) {
                    debugYSlider.max = (value + 100).toString();
                }
                debugYSlider.value = value;
                e.target.value = value.toFixed(1);
                updateElementPosition(selectedDebugElement, null, value);
            }
        });

        // 크기 슬라이더 이벤트
        debugSizeSlider.addEventListener('input', (e) => {
            if (!selectedDebugElement) return;
            const value = parseFloat(e.target.value);
            debugSizeValue.value = value.toFixed(1);
            updateElementSize(selectedDebugElement, value);
        });

        // 크기 입력 필드 이벤트
        debugSizeValue.addEventListener('input', (e) => {
            if (!selectedDebugElement) return;
            const value = parseFloat(e.target.value);
            if (!isNaN(value) && value > 0) {
                // 슬라이더 범위를 동적으로 조정
                const sliderMin = parseFloat(debugSizeSlider.min);
                const sliderMax = parseFloat(debugSizeSlider.max);
                if (value < sliderMin) {
                    debugSizeSlider.min = (value * 0.5).toString();
                } else if (value > sliderMax) {
                    debugSizeSlider.max = (value * 2).toString();
                }
                debugSizeSlider.value = value;
                e.target.value = value.toFixed(1);
                updateElementSize(selectedDebugElement, value);
            }
        });

        // 회전 슬라이더 이벤트
        debugRotationSlider.addEventListener('input', (e) => {
            if (!selectedDebugElement) return;
            const value = parseFloat(e.target.value);
            debugRotationValue.value = value;
            updateElementRotation(selectedDebugElement, value);
        });

        // 회전 입력 필드 이벤트
        debugRotationValue.addEventListener('input', (e) => {
            if (!selectedDebugElement) return;
            const value = parseFloat(e.target.value);
            if (!isNaN(value)) {
                // 슬라이더 범위를 동적으로 조정
                const sliderMin = parseFloat(debugRotationSlider.min);
                const sliderMax = parseFloat(debugRotationSlider.max);
                if (value < sliderMin) {
                    debugRotationSlider.min = (value - 180).toString();
                } else if (value > sliderMax) {
                    debugRotationSlider.max = (value + 180).toString();
                }
                debugRotationSlider.value = value;
                e.target.value = value;
                updateElementRotation(selectedDebugElement, value);
            }
        });

        // 저장 버튼 (선택된 요소만)
        debugSaveBtn.addEventListener('click', () => {
            if (!selectedDebugElement) {
                alert('저장할 요소를 선택해주세요.');
                return;
            }
            saveDebugPosition(selectedDebugElement);
        });

        // 전체 저장 버튼
        debugSaveAllBtn.addEventListener('click', () => {
            saveAllDebugPositions();
        });

        // 초기화 버튼
        debugResetBtn.addEventListener('click', () => {
            if (!selectedDebugElement) return;
            resetDebugPosition(selectedDebugElement);
        });

        // 기본값으로 내보내기 버튼
        if (debugExportBtn) {
            debugExportBtn.addEventListener('click', () => {
                exportDebugPositionsToCode();
            });
        }
    };

    // 초기 실행
    findElements();
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
        debugSizeSlider.value = 4.17;
        debugRotationSlider.value = 0;
        debugXValue.value = '50.00';
        debugYValue.value = '50.00';
        debugSizeValue.value = '4.17';
        debugRotationValue.value = '0';
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
    else if (classList.contains('japan-dish-3')) elementName = 'japan-dish-3';
    else if (classList.contains('japan-dish-4')) elementName = 'japan-dish-4';
    else if (classList.contains('japan-dish-5')) elementName = 'japan-dish-5';
    else if (classList.contains('spoonspot-image')) {
        elementName = selectedDebugElement.id || 'spoonspot-image';
    }
    else if (classList.contains('image-shadow')) {
        // 그림자 이미지는 클래스명으로 식별
        if (classList.contains('shadow-dish2')) elementName = 'shadow-dish2';
        else if (classList.contains('shadow-dish3')) elementName = 'shadow-dish3';
        else if (classList.contains('shadow-dish4')) elementName = 'shadow-dish4';
        else if (classList.contains('shadow-dish5')) elementName = 'shadow-dish5';
        else if (classList.contains('shadow-dish')) elementName = 'shadow-dish';
        else if (classList.contains('shadow-spoon')) elementName = 'shadow-spoon';
        else if (classList.contains('shadow-chopsticks')) elementName = 'shadow-chopsticks';
        else elementName = 'image-shadow';
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
        // drop-chopsticks-2는 별도로 처리
        if (id === 'drop-chopsticks-2') {
            const stage = selectedDebugElement.closest('#japan-stage, #china-stage');
            const stageName = stage && stage.id === 'china-stage' ? '-china' : '-japan';
            elementName = `drop-zone-chopsticks-2${stageName}`;
        } else {
            const itemType = selectedDebugElement.getAttribute('data-item');
            const stage = selectedDebugElement.closest('#japan-stage, #china-stage');
            const stageName = stage && stage.id === 'china-stage' ? '-china' : '-japan';
            elementName = `drop-zone-${itemType}${stageName}`;
        }
    }

    selectedElementSpan.textContent = elementName;

    // vw 단위로 위치 읽기
    const computedStyle = window.getComputedStyle(selectedDebugElement);
    let xVw = 0;
    let yVw = 0;

    // 그림자 이미지는 transform 기반으로 위치 계산
    if (classList.contains('image-shadow')) {
        const left = computedStyle.left;
        const top = computedStyle.top;
        let baseX = 0;
        let baseY = 0;

        // left/top을 vw로 변환
        if (left.includes('vw')) {
            baseX = parseFloat(left);
        } else if (left.includes('%')) {
            const parent = selectedDebugElement.parentElement;
            const parentRect = parent ? parent.getBoundingClientRect() : { width: window.innerWidth, height: window.innerHeight };
            const leftPx = parseFloat(left) || 0;
            baseX = pxToVw((leftPx / 100) * parentRect.width);
        } else {
            const leftPx = parseFloat(left) || 0;
            baseX = pxToVw(leftPx);
        }

        if (top.includes('vw')) {
            baseY = parseFloat(top);
        } else if (top.includes('%')) {
            const parent = selectedDebugElement.parentElement;
            const parentRect = parent ? parent.getBoundingClientRect() : { width: window.innerWidth, height: window.innerHeight };
            const topPx = parseFloat(top) || 0;
            baseY = pxToVw((topPx / 100) * parentRect.height);
        } else {
            const topPx = parseFloat(top) || 0;
            baseY = pxToVw(topPx);
        }

        // transform에서 translate 오프셋 추출
        const transform = computedStyle.transform;
        let offsetX = 0;
        let offsetY = 0;

        if (transform && transform !== 'none') {
            // translate(...) 또는 translateX(...) translateY(...) 형태 파싱
            const translateMatch = transform.match(/translate\(([^)]+)\)/);
            if (translateMatch) {
                const values = translateMatch[1].split(',').map(v => v.trim());
                if (values.length >= 1) {
                    const xValue = values[0];
                    if (xValue.includes('vw')) {
                        offsetX = parseFloat(xValue);
                    } else if (xValue.includes('px')) {
                        offsetX = pxToVw(parseFloat(xValue));
                    } else if (xValue.includes('%')) {
                        // %는 부모 요소 기준
                        const parent = selectedDebugElement.parentElement;
                        const parentRect = parent ? parent.getBoundingClientRect() : { width: window.innerWidth };
                        offsetX = pxToVw((parseFloat(xValue) / 100) * parentRect.width);
                    } else {
                        offsetX = pxToVw(parseFloat(xValue) || 0);
                    }
                }
                if (values.length >= 2) {
                    const yValue = values[1];
                    if (yValue.includes('vw')) {
                        offsetY = parseFloat(yValue);
                    } else if (yValue.includes('px')) {
                        offsetY = pxToVw(parseFloat(yValue));
                    } else if (yValue.includes('%')) {
                        const parent = selectedDebugElement.parentElement;
                        const parentRect = parent ? parent.getBoundingClientRect() : { height: window.innerHeight };
                        offsetY = pxToVw((parseFloat(yValue) / 100) * parentRect.height);
                    } else {
                        offsetY = pxToVw(parseFloat(yValue) || 0);
                    }
                }
            }
        }

        // base 위치 + transform 오프셋 = 실제 위치
        xVw = baseX + offsetX;
        yVw = baseY + offsetY;
    } else {
        // 일반 요소는 기존 로직 사용
        const left = computedStyle.left;
        const top = computedStyle.top;

        // vw 단위인 경우
        if (left.includes('vw')) {
            xVw = parseFloat(left);
        } else if (left.includes('%')) {
            // %를 vw로 변환 (부모 요소 기준)
            const parent = selectedDebugElement.parentElement;
            const parentRect = parent ? parent.getBoundingClientRect() : { width: window.innerWidth, height: window.innerHeight };
            const leftPx = parseFloat(left) || 0;
            xVw = pxToVw((leftPx / 100) * parentRect.width);
        } else {
            // px를 vw로 변환
            const leftPx = parseFloat(left) || 0;
            xVw = pxToVw(leftPx);
        }

        if (top.includes('vw')) {
            yVw = parseFloat(top);
        } else if (top.includes('%')) {
            const parent = selectedDebugElement.parentElement;
            const parentRect = parent ? parent.getBoundingClientRect() : { width: window.innerWidth, height: window.innerHeight };
            const topPx = parseFloat(top) || 0;
            yVw = pxToVw((topPx / 100) * parentRect.height);
        } else {
            const topPx = parseFloat(top) || 0;
            yVw = pxToVw(topPx);
        }
    }

    debugXSlider.value = xVw;
    debugYSlider.value = yVw;
    debugXValue.value = xVw.toFixed(1);
    debugYValue.value = yVw.toFixed(1);

    // 현재 크기 가져오기 (vw 기반)
    let img = selectedDebugElement.querySelector('img');

    // top-cheftable은 배경 이미지이지만 크기 조정 가능
    if (selectedDebugElement.classList.contains('top-cheftable')) {
        const computedStyle = window.getComputedStyle(selectedDebugElement);
        const widthStr = computedStyle.width;
        let sizeVw = 4.17;

        if (widthStr.includes('vw')) {
            sizeVw = parseFloat(widthStr);
        } else if (widthStr.includes('px')) {
            const widthPx = parseFloat(widthStr) || 0;
            sizeVw = pxToVw(widthPx);
        } else if (widthStr.includes('%')) {
            const parent = selectedDebugElement.parentElement;
            const parentRect = parent ? parent.getBoundingClientRect() : { width: window.innerWidth };
            const widthPx = (parseFloat(widthStr) / 100) * parentRect.width;
            sizeVw = pxToVw(widthPx);
        }

        debugSizeSlider.value = sizeVw;
        debugSizeValue.value = sizeVw.toFixed(1);
        debugSizeSlider.disabled = false;
    }
    // card-napkin은 크기 조정 불가
    else if (!img && selectedDebugElement.classList.contains('card-napkin')) {
        debugSizeSlider.value = 4.17;
        debugSizeValue.value = '4.17';
        debugSizeSlider.disabled = true;
    }
    // 드랍존은 크기 조정 가능
    else if (selectedDebugElement.classList.contains('drop-zone')) {
        const dropZoneComputedStyle = window.getComputedStyle(selectedDebugElement);
        const widthStr = dropZoneComputedStyle.width;
        let sizeVw = 4.17;

        if (widthStr.includes('vw')) {
            sizeVw = parseFloat(widthStr);
        } else if (widthStr.includes('px')) {
            const widthPx = parseFloat(widthStr) || 0;
            sizeVw = pxToVw(widthPx);
        } else if (widthStr.includes('%')) {
            const parent = selectedDebugElement.parentElement;
            const parentRect = parent ? parent.getBoundingClientRect() : { width: window.innerWidth };
            const widthPx = (parseFloat(widthStr) / 100) * parentRect.width;
            sizeVw = pxToVw(widthPx);
        }

        debugSizeSlider.value = sizeVw;
        debugSizeValue.value = sizeVw.toFixed(1);
        debugSizeSlider.disabled = false;
    }
    // spoonspot-image는 크기 조정 가능
    else if (selectedDebugElement.classList.contains('spoonspot-image')) {
        const spoonspotImg = selectedDebugElement.querySelector('img');
        if (spoonspotImg) {
            const imgComputedStyle = window.getComputedStyle(spoonspotImg);
            const widthStr = imgComputedStyle.width;
            let sizeVw = 4.17;

            if (widthStr.includes('vw')) {
                sizeVw = parseFloat(widthStr);
            } else if (widthStr.includes('px')) {
                const widthPx = parseFloat(widthStr) || 0;
                sizeVw = pxToVw(widthPx);
            } else if (widthStr.includes('%')) {
                const parent = spoonspotImg.parentElement;
                const parentRect = parent ? parent.getBoundingClientRect() : { width: window.innerWidth };
                const widthPx = (parseFloat(widthStr) / 100) * parentRect.width;
                sizeVw = pxToVw(widthPx);
            }

            debugSizeSlider.value = sizeVw;
            debugSizeValue.value = sizeVw.toFixed(1);
            debugSizeSlider.disabled = false;
        } else {
            debugSizeSlider.disabled = false;
        }
    } else {
        debugSizeSlider.disabled = false;
    }

    if (img) {
        const imgComputedStyle = window.getComputedStyle(img);
        const widthStr = imgComputedStyle.width;
        let sizeVw = 4.17; // 기본값

        // vw 단위인 경우
        if (widthStr.includes('vw')) {
            sizeVw = parseFloat(widthStr);
        } else if (widthStr.includes('px')) {
            // px를 vw로 변환
            const widthPx = parseFloat(widthStr) || 0;
            sizeVw = pxToVw(widthPx);
        } else if (widthStr.includes('%')) {
            // %를 vw로 변환 (부모 요소 기준)
            const parent = img.parentElement;
            const parentRect = parent ? parent.getBoundingClientRect() : { width: window.innerWidth };
            const widthPx = (parseFloat(widthStr) / 100) * parentRect.width;
            sizeVw = pxToVw(widthPx);
        }

        debugSizeSlider.value = sizeVw;
        debugSizeValue.value = sizeVw.toFixed(1);
    } else {
        debugSizeSlider.value = 4.17;
        debugSizeValue.value = '4.17';
    }

    // 현재 회전 값 가져오기
    const rotationComputedStyle = window.getComputedStyle(selectedDebugElement);
    const rotationTransform = rotationComputedStyle.transform;
    let rotation = 0;

    // 그림자 이미지는 부모 요소의 transform에서만 회전 추출
    if (selectedDebugElement.classList.contains('image-shadow')) {
        if (rotationTransform && rotationTransform !== 'none') {
            // rotate(...deg) 형태 확인 (translate와 함께 있을 수 있음)
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
    } else {
        // 일반 요소는 기존 로직 사용
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
    }

    debugRotationSlider.value = rotation;
    debugRotationValue.value = rotation;
}

// px를 vw로 변환하는 헬퍼 함수
function pxToVw(px) {
    return (px / window.innerWidth) * 100;
}

// vw를 px로 변환하는 헬퍼 함수
function vwToPx(vw) {
    return (vw / 100) * window.innerWidth;
}

// 요소 위치 업데이트 (vw 기반)
function updateElementPosition(element, x, y) {
    // 그림자 이미지는 left/top을 직접 조정
    if (element.classList.contains('image-shadow')) {
        const computedStyle = window.getComputedStyle(element);
        const currentTransform = computedStyle.transform;

        // 기존 transform에서 translate 부분 추출 (오프셋 유지)
        let transformOffset = '';
        if (currentTransform && currentTransform !== 'none') {
            // translate(...) 부분 찾기
            const translateMatch = currentTransform.match(/translate\([^)]+\)/);
            if (translateMatch) {
                transformOffset = translateMatch[0];
            }
        }

        // left/top 업데이트
        if (x !== null) {
            element.style.left = `${x}vw`;
        }
        if (y !== null) {
            element.style.top = `${y}vw`;
        }

        // transform은 유지 (오프셋이 있는 경우)
        if (transformOffset) {
            // 기존 transform에서 translate를 제외한 나머지 부분 유지
            const otherTransforms = currentTransform.replace(/translate\([^)]+\)/g, '').trim();
            if (otherTransforms) {
                element.style.transform = `${transformOffset} ${otherTransforms}`.trim();
            } else {
                element.style.transform = transformOffset;
            }
        }
    } else {
        // 일반 요소는 기존 로직 사용
        if (x !== null) {
            element.style.left = `${x}vw`;
        }
        if (y !== null) {
            element.style.top = `${y}vw`;
        }

        // 셰프테이블은 CSS에서 left: 50%와 transform: translateX(-50%)를 사용하므로
        // vw 기반 위치를 설정할 때 transform을 초기화
        if (element.classList.contains('top-cheftable')) {
            element.style.transform = 'none';
        }
    }

    // 그림자 위치 동기화 (그림자 이미지가 아닌 경우에만)
    if (!element.classList.contains('image-shadow')) {
        syncShadowPositions();
    }
}

// 요소 회전 업데이트
function updateElementRotation(element, rotationDegrees) {
    // 그림자 이미지는 부모 요소에 회전 적용
    if (element.classList.contains('image-shadow')) {
        const computedStyle = window.getComputedStyle(element);
        const currentTransform = computedStyle.transform;
        let transformParts = [];

        // 기존 transform에서 translate 부분 추출 (오프셋 유지)
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
        }

        // rotate 추가
        if (rotationDegrees !== 0) {
            transformParts.push(`rotate(${rotationDegrees}deg)`);
        }

        // transform 결합
        if (transformParts.length > 0) {
            element.style.transform = transformParts.join(' ');
        } else {
            element.style.transform = 'none';
        }
        return;
    }

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

// 요소 크기 업데이트 (vw 기반)
function updateElementSize(element, sizeVw) {
    // card-napkin은 크기 조정 불가
    if (element.classList.contains('card-napkin')) {
        return;
    }

    // 드랍존은 직접 크기 조정 (width와 height 모두 조정)
    if (element.classList.contains('drop-zone')) {
        // 드랍존의 현재 높이 비율 유지
        const currentWidth = parseFloat(window.getComputedStyle(element).width) || 0;
        const currentHeight = parseFloat(window.getComputedStyle(element).height) || 0;
        let aspectRatio = 1;

        if (currentWidth > 0 && currentHeight > 0) {
            aspectRatio = currentHeight / currentWidth;
        } else {
            // 드랍존에 매핑된 이미지로부터 비율 가져오기
            const imageMapping = {
                'drop-rice-bowl': 'resource/jp/dish.png',
                'drop-spoon': 'resource/jp/spoon.png',
                'drop-chopsticks': 'resource/jp/chopsticks.png',
                'drop-chopsticks-2': 'resource/jp/chopsticks.png'
            };

            const dropZoneId = element.id;
            const imageSrc = imageMapping[dropZoneId];

            if (imageSrc) {
                const img = new Image();
                img.onload = function () {
                    const naturalWidth = this.naturalWidth;
                    const naturalHeight = this.naturalHeight;
                    const aspectRatio = naturalHeight / naturalWidth;
                    const heightVw = sizeVw * aspectRatio;
                    element.style.width = `${sizeVw}vw`;
                    element.style.height = `${heightVw}vw`;
                };
                img.src = imageSrc;

                // 이미 로드된 경우 즉시 실행
                if (img.complete && img.naturalWidth > 0) {
                    const naturalWidth = img.naturalWidth;
                    const naturalHeight = img.naturalHeight;
                    const aspectRatio = naturalHeight / naturalWidth;
                    const heightVw = sizeVw * aspectRatio;
                    element.style.width = `${sizeVw}vw`;
                    element.style.height = `${heightVw}vw`;
                } else {
                    // 이미지가 아직 로드되지 않은 경우 기본 비율 사용
                    element.style.width = `${sizeVw}vw`;
                    element.style.height = `${sizeVw}vw`;
                }
                return;
            }
        }

        const heightVw = sizeVw * aspectRatio;
        element.style.width = `${sizeVw}vw`;
        element.style.height = `${heightVw}vw`;
        return;
    }

    // top-cheftable은 배경 이미지이므로 직접 크기 조정
    if (element.classList.contains('top-cheftable')) {
        // 배경 이미지의 비율을 유지하기 위해 원본 이미지 크기 확인
        const img = new Image();
        img.onload = function () {
            const naturalWidth = this.naturalWidth;
            const naturalHeight = this.naturalHeight;
            const aspectRatio = naturalHeight / naturalWidth;
            const heightVw = sizeVw * aspectRatio;
            element.style.width = `${sizeVw}vw`;
            element.style.height = `${heightVw}vw`;
        };
        img.src = 'resource/jp/cheftable.png';
        // 이미 로드된 경우 즉시 실행
        if (img.complete && img.naturalWidth > 0) {
            const naturalWidth = img.naturalWidth;
            const naturalHeight = img.naturalHeight;
            const aspectRatio = naturalHeight / naturalWidth;
            const heightVw = sizeVw * aspectRatio;
            element.style.width = `${sizeVw}vw`;
            element.style.height = `${heightVw}vw`;
        } else {
            // 이미지가 아직 로드되지 않은 경우 기본값 설정
            element.style.width = `${sizeVw}vw`;
            // 임시로 높이를 width와 동일하게 설정 (이미지 로드 후 업데이트됨)
            element.style.height = `${sizeVw}vw`;
        }
        return;
    }

    // spoonspot-image는 img 자식 요소의 크기 조정
    if (element.classList.contains('spoonspot-image')) {
        const img = element.querySelector('img');
        if (!img) return;

        // 이미지가 로드될 때까지 대기
        if (img.naturalWidth === 0 || img.naturalHeight === 0) {
            img.onload = function () {
                updateElementSize(element, sizeVw);
            };
            return;
        }

        // 이미지 비율 유지하며 크기 조정
        const naturalWidth = img.naturalWidth;
        const naturalHeight = img.naturalHeight;
        const aspectRatio = naturalHeight / naturalWidth;
        const heightVw = sizeVw * aspectRatio;

        img.style.width = `${sizeVw}vw`;
        img.style.height = `${heightVw}vw`;
        img.style.maxWidth = `${sizeVw}vw`;
        return;
    }

    const img = element.querySelector('img');
    if (!img) return;

    // 이미지가 로드될 때까지 대기
    if (img.naturalWidth === 0 || img.naturalHeight === 0) {
        img.onload = function () {
            updateElementSize(element, sizeVw);
        };
        return;
    }

    // vw 단위로 크기 설정
    img.style.width = `${sizeVw}vw`;
    img.style.height = 'auto';
    img.style.maxWidth = `${sizeVw}vw`;
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
    else if (classList.contains('japan-dish-3')) elementName = 'japan-dish-3';
    else if (classList.contains('japan-dish-4')) elementName = 'japan-dish-4';
    else if (classList.contains('japan-dish-5')) elementName = 'japan-dish-5';
    else if (classList.contains('spoonspot-image')) {
        elementName = element.id || 'spoonspot-image';
    }
    else if (classList.contains('image-shadow')) {
        // 그림자 이미지는 클래스명으로 식별
        if (classList.contains('shadow-dish2')) elementName = 'shadow-dish2';
        else if (classList.contains('shadow-dish3')) elementName = 'shadow-dish3';
        else if (classList.contains('shadow-dish4')) elementName = 'shadow-dish4';
        else if (classList.contains('shadow-dish5')) elementName = 'shadow-dish5';
        else if (classList.contains('shadow-dish')) elementName = 'shadow-dish';
        else if (classList.contains('shadow-spoon')) elementName = 'shadow-spoon';
        else if (classList.contains('shadow-chopsticks')) elementName = 'shadow-chopsticks';
        else elementName = 'image-shadow';
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
        // drop-chopsticks-2는 별도로 처리
        if (id === 'drop-chopsticks-2') {
            const stage = element.closest('#japan-stage, #china-stage');
            const stageName = stage && stage.id === 'china-stage' ? '-china' : '-japan';
            elementName = `drop-zone-chopsticks-2${stageName}`;
        } else {
            const itemType = element.getAttribute('data-item');
            const stage = element.closest('#japan-stage, #china-stage');
            const stageName = stage && stage.id === 'china-stage' ? '-china' : '-japan';
            elementName = `drop-zone-${itemType}${stageName}`;
        }
    }

    if (!elementName || elementName === '알 수 없음') return;

    const saveComputedStyle = window.getComputedStyle(element);
    const left = saveComputedStyle.left;
    const top = saveComputedStyle.top;

    // vw 단위로 변환
    let xVw = 0;
    let yVw = 0;

    // 그림자 이미지는 transform 기반으로 위치 계산
    if (element.classList.contains('image-shadow')) {
        let baseX = 0;
        let baseY = 0;

        // left/top을 vw로 변환
        if (left.includes('vw')) {
            baseX = parseFloat(left);
        } else if (left.includes('%')) {
            const parent = element.parentElement;
            const parentRect = parent ? parent.getBoundingClientRect() : { width: window.innerWidth, height: window.innerHeight };
            const leftPx = parseFloat(left) || 0;
            baseX = pxToVw((leftPx / 100) * parentRect.width);
        } else {
            const leftPx = parseFloat(left) || 0;
            baseX = pxToVw(leftPx);
        }

        if (top.includes('vw')) {
            baseY = parseFloat(top);
        } else if (top.includes('%')) {
            const parent = element.parentElement;
            const parentRect = parent ? parent.getBoundingClientRect() : { width: window.innerWidth, height: window.innerHeight };
            const topPx = parseFloat(top) || 0;
            baseY = pxToVw((topPx / 100) * parentRect.height);
        } else {
            const topPx = parseFloat(top) || 0;
            baseY = pxToVw(topPx);
        }

        // transform에서 translate 오프셋 추출
        const transform = saveComputedStyle.transform;
        let offsetX = 0;
        let offsetY = 0;

        if (transform && transform !== 'none') {
            const translateMatch = transform.match(/translate\(([^)]+)\)/);
            if (translateMatch) {
                const values = translateMatch[1].split(',').map(v => v.trim());
                if (values.length >= 1) {
                    const xValue = values[0];
                    if (xValue.includes('vw')) {
                        offsetX = parseFloat(xValue);
                    } else if (xValue.includes('px')) {
                        offsetX = pxToVw(parseFloat(xValue));
                    } else if (xValue.includes('%')) {
                        const parent = element.parentElement;
                        const parentRect = parent ? parent.getBoundingClientRect() : { width: window.innerWidth };
                        offsetX = pxToVw((parseFloat(xValue) / 100) * parentRect.width);
                    } else {
                        offsetX = pxToVw(parseFloat(xValue) || 0);
                    }
                }
                if (values.length >= 2) {
                    const yValue = values[1];
                    if (yValue.includes('vw')) {
                        offsetY = parseFloat(yValue);
                    } else if (yValue.includes('px')) {
                        offsetY = pxToVw(parseFloat(yValue));
                    } else if (yValue.includes('%')) {
                        const parent = element.parentElement;
                        const parentRect = parent ? parent.getBoundingClientRect() : { height: window.innerHeight };
                        offsetY = pxToVw((parseFloat(yValue) / 100) * parentRect.height);
                    } else {
                        offsetY = pxToVw(parseFloat(yValue) || 0);
                    }
                }
            }
        }

        // base 위치 + transform 오프셋 = 실제 위치
        xVw = baseX + offsetX;
        yVw = baseY + offsetY;
    } else if (element.classList.contains('top-cheftable')) {
        // 셰프테이블은 CSS에서 left: 50%와 transform: translateX(-50%)를 사용하므로
        // 실제 위치를 계산하기 위해 transform 오프셋도 고려
        let baseX = 0;
        let baseY = 0;

        // left/top을 vw로 변환
        if (left.includes('vw')) {
            baseX = parseFloat(left);
        } else if (left.includes('%')) {
            const parent = element.parentElement;
            const parentRect = parent ? parent.getBoundingClientRect() : { width: window.innerWidth, height: window.innerHeight };
            const leftPx = parseFloat(left) || 0;
            baseX = pxToVw((leftPx / 100) * parentRect.width);
        } else {
            const leftPx = parseFloat(left) || 0;
            baseX = pxToVw(leftPx);
        }

        if (top.includes('vw')) {
            baseY = parseFloat(top);
        } else if (top.includes('%')) {
            const parent = element.parentElement;
            const parentRect = parent ? parent.getBoundingClientRect() : { width: window.innerWidth, height: window.innerHeight };
            const topPx = parseFloat(top) || 0;
            baseY = pxToVw((topPx / 100) * parentRect.height);
        } else {
            const topPx = parseFloat(top) || 0;
            baseY = pxToVw(topPx);
        }

        // transform에서 translate 오프셋 추출
        const transform = saveComputedStyle.transform;
        let offsetX = 0;
        let offsetY = 0;

        if (transform && transform !== 'none') {
            // translateX(...) 또는 translate(...) 형태 확인
            const translateXMatch = transform.match(/translateX\(([^)]+)\)/);
            const translateMatch = transform.match(/translate\(([^)]+)\)/);

            if (translateXMatch) {
                const xValue = translateXMatch[1];
                if (xValue.includes('vw')) {
                    offsetX = parseFloat(xValue);
                } else if (xValue.includes('px')) {
                    offsetX = pxToVw(parseFloat(xValue));
                } else if (xValue.includes('%')) {
                    const parent = element.parentElement;
                    const parentRect = parent ? parent.getBoundingClientRect() : { width: window.innerWidth };
                    offsetX = pxToVw((parseFloat(xValue) / 100) * parentRect.width);
                } else {
                    offsetX = pxToVw(parseFloat(xValue) || 0);
                }
            } else if (translateMatch) {
                const values = translateMatch[1].split(',').map(v => v.trim());
                if (values.length >= 1) {
                    const xValue = values[0];
                    if (xValue.includes('vw')) {
                        offsetX = parseFloat(xValue);
                    } else if (xValue.includes('px')) {
                        offsetX = pxToVw(parseFloat(xValue));
                    } else if (xValue.includes('%')) {
                        const parent = element.parentElement;
                        const parentRect = parent ? parent.getBoundingClientRect() : { width: window.innerWidth };
                        offsetX = pxToVw((parseFloat(xValue) / 100) * parentRect.width);
                    } else {
                        offsetX = pxToVw(parseFloat(xValue) || 0);
                    }
                }
            }
        }

        // base 위치 + transform 오프셋 = 실제 위치
        xVw = baseX + offsetX;
        yVw = baseY + offsetY;
    } else {
        // 일반 요소는 기존 로직 사용
        if (left.includes('vw')) {
            xVw = parseFloat(left);
        } else if (left.includes('%')) {
            const parent = element.parentElement;
            const parentRect = parent ? parent.getBoundingClientRect() : { width: window.innerWidth, height: window.innerHeight };
            const leftPx = parseFloat(left) || 0;
            xVw = pxToVw((leftPx / 100) * parentRect.width);
        } else {
            const leftPx = parseFloat(left) || 0;
            xVw = pxToVw(leftPx);
        }

        if (top.includes('vw')) {
            yVw = parseFloat(top);
        } else if (top.includes('%')) {
            const parent = element.parentElement;
            const parentRect = parent ? parent.getBoundingClientRect() : { width: window.innerWidth, height: window.innerHeight };
            const topPx = parseFloat(top) || 0;
            yVw = pxToVw((topPx / 100) * parentRect.height);
        } else {
            const topPx = parseFloat(top) || 0;
            yVw = pxToVw(topPx);
        }
    }

    // 크기 정보 가져오기 (vw 기반)
    let sizeVw = 4.17;
    // top-cheftable은 배경 이미지이지만 크기 조정 가능
    if (element.classList.contains('top-cheftable')) {
        const elementComputedStyle = window.getComputedStyle(element);
        const widthStr = elementComputedStyle.width;

        if (widthStr.includes('vw')) {
            sizeVw = parseFloat(widthStr);
        } else if (widthStr.includes('px')) {
            const widthPx = parseFloat(widthStr) || 0;
            sizeVw = pxToVw(widthPx);
        } else if (widthStr.includes('%')) {
            const parent = element.parentElement;
            const parentRect = parent ? parent.getBoundingClientRect() : { width: window.innerWidth };
            const widthPx = (parseFloat(widthStr) / 100) * parentRect.width;
            sizeVw = pxToVw(widthPx);
        }
    } else if (element.classList.contains('card-napkin')) {
        sizeVw = 4.17; // card-napkin은 크기 조정 불가
    } else if (element.classList.contains('drop-zone')) {
        // 드랍존의 크기 가져오기
        const dropZoneComputedStyle = window.getComputedStyle(element);
        const widthStr = dropZoneComputedStyle.width;

        if (widthStr.includes('vw')) {
            sizeVw = parseFloat(widthStr);
        } else if (widthStr.includes('px')) {
            const widthPx = parseFloat(widthStr) || 0;
            sizeVw = pxToVw(widthPx);
        } else if (widthStr.includes('%')) {
            const parent = element.parentElement;
            const parentRect = parent ? parent.getBoundingClientRect() : { width: window.innerWidth };
            const widthPx = (parseFloat(widthStr) / 100) * parentRect.width;
            sizeVw = pxToVw(widthPx);
        }
    } else {
        const saveSizeImg = element.querySelector('img');
        if (saveSizeImg) {
            const imgComputedStyle = window.getComputedStyle(saveSizeImg);
            const widthStr = imgComputedStyle.width;

            if (widthStr.includes('vw')) {
                sizeVw = parseFloat(widthStr);
            } else if (widthStr.includes('px')) {
                const widthPx = parseFloat(widthStr) || 0;
                sizeVw = pxToVw(widthPx);
            } else if (widthStr.includes('%')) {
                const parent = saveSizeImg.parentElement;
                const parentRect = parent ? parent.getBoundingClientRect() : { width: window.innerWidth };
                const widthPx = (parseFloat(widthStr) / 100) * parentRect.width;
                sizeVw = pxToVw(widthPx);
            }
        }
    }

    // 회전 정보 가져오기
    let rotation = 0;

    // 그림자 이미지는 부모 요소의 transform에서 회전 추출
    if (element.classList.contains('image-shadow')) {
        const saveRotationTransform = saveComputedStyle.transform;
        if (saveRotationTransform && saveRotationTransform !== 'none') {
            // rotate(...deg) 형태 확인 (translate와 함께 있을 수 있음)
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
    } else {
        // 일반 요소는 기존 로직 사용
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
    }

    debugPositions[elementName] = { x: xVw, y: yVw, size: sizeVw, rotation: rotation };

    // localStorage에 저장
    localStorage.setItem('debugPositions', JSON.stringify(debugPositions));

    alert(`${elementName} 위치, 크기, 회전이 저장되었습니다!`);
}

// 모든 디버그 가능한 요소의 위치 저장
function saveAllDebugPositions() {
    const allElements = [];

    // 일본 스테이지 요소들
    const japanStage = document.getElementById('japan-stage');
    if (japanStage) {
        // soup-bowl-japan
        const soupBowlJapan = japanStage.querySelector('.soup-bowl-image');
        if (soupBowlJapan) allElements.push(soupBowlJapan);

        // hand-japan
        const handJapan = japanStage.querySelector('.hand-draggable');
        if (handJapan) allElements.push(handJapan);

        // cheftable-japan
        const cheftableJapan = japanStage.querySelector('.top-cheftable');
        if (cheftableJapan) allElements.push(cheftableJapan);

        // card-napkin-japan
        const cardNapkinJapan = japanStage.querySelector('.card-napkin');
        if (cardNapkinJapan) allElements.push(cardNapkinJapan);

        // japan-dish-3, 4, 5
        const dish3 = japanStage.querySelector('.japan-dish-3');
        if (dish3) allElements.push(dish3);
        const dish4 = japanStage.querySelector('.japan-dish-4');
        if (dish4) allElements.push(dish4);
        const dish5 = japanStage.querySelector('.japan-dish-5');
        if (dish5) allElements.push(dish5);
        // spoonspot-image
        const spoonspot1 = japanStage.querySelector('#spoonspot-1');
        if (spoonspot1) allElements.push(spoonspot1);
        const spoonspot2 = japanStage.querySelector('#spoonspot-2');
        if (spoonspot2) allElements.push(spoonspot2);

        // drop-zone-japan
        const dropRiceBowl = japanStage.querySelector('#drop-rice-bowl');
        if (dropRiceBowl) allElements.push(dropRiceBowl);
        const dropSpoon = japanStage.querySelector('#drop-spoon');
        if (dropSpoon) allElements.push(dropSpoon);
        const dropChopsticks = japanStage.querySelector('#drop-chopsticks');
        if (dropChopsticks) allElements.push(dropChopsticks);
        const dropChopsticks2 = japanStage.querySelector('#drop-chopsticks-2');
        if (dropChopsticks2) allElements.push(dropChopsticks2);

        // 그림자 이미지 (display: none이어도 저장되도록 일시적으로 표시)
        const shadowDish2 = japanStage.querySelector('.shadow-dish2');
        if (shadowDish2) {
            const wasHidden2 = shadowDish2.style.display === 'none' || window.getComputedStyle(shadowDish2).display === 'none';
            if (wasHidden2) shadowDish2.style.display = 'block';
            allElements.push(shadowDish2);
        }
        const shadowDish3 = japanStage.querySelector('.shadow-dish3');
        if (shadowDish3) {
            const wasHidden3 = shadowDish3.style.display === 'none' || window.getComputedStyle(shadowDish3).display === 'none';
            if (wasHidden3) shadowDish3.style.display = 'block';
            allElements.push(shadowDish3);
        }
        const shadowDish4 = japanStage.querySelector('.shadow-dish4');
        if (shadowDish4) {
            const wasHidden4 = shadowDish4.style.display === 'none' || window.getComputedStyle(shadowDish4).display === 'none';
            if (wasHidden4) shadowDish4.style.display = 'block';
            allElements.push(shadowDish4);
        }
        const shadowDish5 = japanStage.querySelector('.shadow-dish5');
        if (shadowDish5) {
            const wasHidden5 = shadowDish5.style.display === 'none' || window.getComputedStyle(shadowDish5).display === 'none';
            if (wasHidden5) shadowDish5.style.display = 'block';
            allElements.push(shadowDish5);
        }
        const shadowDish = japanStage.querySelector('.shadow-dish');
        if (shadowDish) {
            const wasHidden = shadowDish.style.display === 'none' || window.getComputedStyle(shadowDish).display === 'none';
            if (wasHidden) shadowDish.style.display = 'block';
            allElements.push(shadowDish);
        }
        const shadowSpoon = japanStage.querySelector('.shadow-spoon');
        if (shadowSpoon) {
            const wasHiddenSpoon = shadowSpoon.style.display === 'none' || window.getComputedStyle(shadowSpoon).display === 'none';
            if (wasHiddenSpoon) shadowSpoon.style.display = 'block';
            allElements.push(shadowSpoon);
        }
        const shadowChopsticks = japanStage.querySelector('.shadow-chopsticks');
        if (shadowChopsticks) {
            const wasHiddenChopsticks = shadowChopsticks.style.display === 'none' || window.getComputedStyle(shadowChopsticks).display === 'none';
            if (wasHiddenChopsticks) shadowChopsticks.style.display = 'block';
            allElements.push(shadowChopsticks);
        }

        // cheftable-rice-bowl-japan
        const cheftableRiceBowlJapan = japanStage.querySelector('.cheftable-rice-bowl');
        if (cheftableRiceBowlJapan) allElements.push(cheftableRiceBowlJapan);
    }

    // grab-image
    const grabImage = document.getElementById('grab-image');
    if (grabImage) allElements.push(grabImage);

    // 중국 스테이지 요소들
    const chinaStage = document.getElementById('china-stage');
    if (chinaStage) {
        // cn-spoon
        const cnSpoon = chinaStage.querySelector('.cn-spoon');
        if (cnSpoon) allElements.push(cnSpoon);

        // cn-chopstick
        const cnChopstick = chinaStage.querySelector('.cn-chopstick');
        if (cnChopstick) allElements.push(cnChopstick);

        // cn-rice
        const cnRice = chinaStage.querySelector('.cn-rice');
        if (cnRice) allElements.push(cnRice);

        // cn-dish
        const cnDish = chinaStage.querySelector('.cn-dish');
        if (cnDish) allElements.push(cnDish);

        // cn-table1
        const cnTable1 = chinaStage.querySelector('.china-table-image-1');
        if (cnTable1) allElements.push(cnTable1);

        // cn-table2
        const cnTable2 = chinaStage.querySelector('.china-table-image');
        if (cnTable2) allElements.push(cnTable2);

        // soup-bowl-china
        const soupBowlChina = chinaStage.querySelector('.soup-bowl-image');
        if (soupBowlChina) allElements.push(soupBowlChina);

        // hand-china
        const handChina = chinaStage.querySelector('.hand-draggable');
        if (handChina) allElements.push(handChina);

        // cheftable-china
        const cheftableChina = chinaStage.querySelector('.top-cheftable');
        if (cheftableChina) allElements.push(cheftableChina);

        // card-napkin-china
        const cardNapkinChina = chinaStage.querySelector('.card-napkin');
        if (cardNapkinChina) allElements.push(cardNapkinChina);

        // cheftable-rice-bowl-china
        const cheftableRiceBowlChina = chinaStage.querySelector('.cheftable-rice-bowl');
        if (cheftableRiceBowlChina) allElements.push(cheftableRiceBowlChina);

        // drop-zone-china (동적으로 생성될 수 있음)
        const dropRiceBowlChina = chinaStage.querySelector('#drop-rice-bowl');
        if (dropRiceBowlChina) allElements.push(dropRiceBowlChina);
        const dropSpoonChina = chinaStage.querySelector('#drop-spoon');
        if (dropSpoonChina) allElements.push(dropSpoonChina);
        const dropChopsticksChina = chinaStage.querySelector('#drop-chopsticks');
        if (dropChopsticksChina) allElements.push(dropChopsticksChina);
    }

    // 그림자 요소들의 원래 display 상태 저장 (나중에 복원하기 위해)
    const shadowDisplayStates = new Map();
    allElements.forEach(element => {
        if (element.classList.contains('image-shadow')) {
            const computedDisplay = window.getComputedStyle(element).display;
            shadowDisplayStates.set(element, computedDisplay);
            // 일시적으로 표시 (위치 정보를 제대로 가져오기 위해)
            if (computedDisplay === 'none') {
                element.style.display = 'block';
            }
        }
    });

    // 모든 요소 저장
    // saveDebugPosition 함수를 직접 호출하여 동일한 로직 사용
    let savedCount = 0;
    allElements.forEach(element => {
        const elementName = getElementName(element);
        if (elementName && elementName !== '알 수 없음') {
            // saveDebugPosition 함수를 직접 호출하여 정확한 값 저장
            // 하지만 alert는 표시하지 않도록 임시로 처리
            const originalAlert = window.alert;
            window.alert = function () {
                // alert 호출 무시 (전체 저장 시 각 요소마다 alert가 뜨는 것을 방지)
            };

            // saveDebugPosition 호출 (내부적으로 debugPositions에 저장됨)
            saveDebugPosition(element);

            // alert 복원
            window.alert = originalAlert;

            savedCount++;
        }
    });

    // localStorage에 저장
    localStorage.setItem('debugPositions', JSON.stringify(debugPositions));

    // 그림자 요소들의 원래 display 상태 복원
    shadowDisplayStates.forEach((originalDisplay, element) => {
        if (originalDisplay === 'none') {
            element.style.display = 'none';
        } else {
            element.style.display = originalDisplay;
        }
    });

    alert(`전체 ${savedCount}개 요소의 위치, 크기, 회전이 저장되었습니다!`);
}

// 요소 이름 가져오기 (saveDebugPosition과 동일한 로직)
function getElementName(element) {
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
    else if (classList.contains('japan-dish-3')) elementName = 'japan-dish-3';
    else if (classList.contains('japan-dish-4')) elementName = 'japan-dish-4';
    else if (classList.contains('japan-dish-5')) elementName = 'japan-dish-5';
    else if (classList.contains('spoonspot-image')) {
        elementName = element.id || 'spoonspot-image';
    }
    else if (classList.contains('image-shadow')) {
        // 그림자 이미지는 클래스명으로 식별
        if (classList.contains('shadow-dish2')) elementName = 'shadow-dish2';
        else if (classList.contains('shadow-dish3')) elementName = 'shadow-dish3';
        else if (classList.contains('shadow-dish4')) elementName = 'shadow-dish4';
        else if (classList.contains('shadow-dish5')) elementName = 'shadow-dish5';
        else if (classList.contains('shadow-dish')) elementName = 'shadow-dish';
        else if (classList.contains('shadow-spoon')) elementName = 'shadow-spoon';
        else if (classList.contains('shadow-chopsticks')) elementName = 'shadow-chopsticks';
        else elementName = 'image-shadow';
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
        // drop-chopsticks-2는 별도로 처리
        if (id === 'drop-chopsticks-2') {
            const stage = element.closest('#japan-stage, #china-stage');
            const stageName = stage && stage.id === 'china-stage' ? '-china' : '-japan';
            elementName = `drop-zone-chopsticks-2${stageName}`;
        } else {
            const itemType = element.getAttribute('data-item');
            const stage = element.closest('#japan-stage, #china-stage');
            const stageName = stage && stage.id === 'china-stage' ? '-china' : '-japan';
            elementName = `drop-zone-${itemType}${stageName}`;
        }
    }

    return elementName || '알 수 없음';
}

// 디버그 위치 불러오기 (항상 기본값만 사용)
function loadDebugPositions() {
    // 항상 기본값만 사용 (localStorage 무시)
    debugPositions = JSON.parse(JSON.stringify(defaultDebugPositions));

    if (Object.keys(debugPositions).length > 0) {
        // 모든 이미지 로드 완료 후 위치 적용
        waitForAllImages(() => {
            setTimeout(() => {
                applyDebugPositions();
                syncShadowPositions();
            }, 100);
        });
    }
}

// 현재 localStorage의 디버그 위치를 코드로 내보내기 (콘솔에 출력)
// 이 함수를 콘솔에서 실행하면 현재 설정값을 복사해서 defaultDebugPositions에 붙여넣을 수 있습니다.
function exportDebugPositionsToCode() {
    // 기본값 사용 (localStorage 무시)
    const positions = defaultDebugPositions;
    const codeString = JSON.stringify(positions, null, 4);

    // script.js에 직접 붙여넣을 수 있는 형태로 포맷팅
    const formattedCode = `const defaultDebugPositions = ${codeString};`;

    console.log('=== defaultDebugPositions에 복사할 코드 ===');
    console.log(formattedCode);
    console.log('\n위 코드를 복사해서 script.js의 defaultDebugPositions 변수에 붙여넣으세요.');
    console.log('(기존 const defaultDebugPositions = {}; 부분을 위 코드로 교체하세요)');

    // 클립보드에 복사 시도 (브라우저 지원 시)
    if (navigator.clipboard) {
        navigator.clipboard.writeText(formattedCode).then(() => {
            alert('✓ 코드가 클립보드에 복사되었습니다!\n\n콘솔(F12)을 열어 확인하거나, script.js 파일의 defaultDebugPositions 변수를 위 코드로 교체하세요.');
            console.log('✓ 클립보드에 복사되었습니다!');
        }).catch(() => {
            alert('클립보드 복사 실패. 콘솔(F12)에서 코드를 확인하세요.');
            console.log('클립보드 복사 실패. 위의 코드를 수동으로 복사하세요.');
        });
    } else {
        alert('브라우저가 클립보드 복사를 지원하지 않습니다.\n콘솔(F12)을 열어 코드를 확인하세요.');
    }

    return positions;
}

// 저장된 위치 적용
function applyDebugPositions() {
    if (!debugPositions || Object.keys(debugPositions).length === 0) {
        return; // 저장된 위치가 없으면 종료
    }

    Object.keys(debugPositions).forEach(elementName => {
        const position = debugPositions[elementName];
        if (!position || position.x === undefined || position.y === undefined) {
            return; // 위치 정보가 없으면 건너뛰기
        }

        let element = null;

        // 중국 스테이지 요소 매핑 업데이트
        if (elementName === 'cn-spoon') element = document.querySelector('.setting-spoon');
        else if (elementName === 'cn-chopstick') element = document.querySelector('.setting-chopsticks');
        else if (elementName === 'cn-rice') element = document.querySelector('.setting-bowl');
        else if (elementName === 'cn-dish') element = document.querySelector('.setting-plate');
        else if (elementName === 'cn-teapot') element = document.querySelector('.setting-tea-pot');
        else if (elementName === 'cn-cup') element = document.querySelector('.setting-tea-cup');
        else if (elementName === 'cn-mat') element = document.querySelector('.setting-mat');
        else if (elementName === 'cn-table1') element = document.querySelector('.china-table-image-1');
        else if (elementName === 'cn-table2') element = document.querySelector('.china-table-image');

        // 기존 요소들
        else if (elementName === 'grab-image') element = document.getElementById('grab-image');
        else if (elementName === 'soup-bowl-japan') element = document.querySelector('#japan-stage .soup-bowl-image');
        else if (elementName === 'soup-bowl-china') element = document.querySelector('#china-stage .soup-bowl-image');
        else if (elementName === 'hand-japan') element = document.querySelector('#japan-stage .hand-draggable');
        else if (elementName === 'hand-china') element = document.querySelector('#china-stage .hand-draggable');
        else if (elementName === 'cheftable-japan') element = document.querySelector('#japan-stage .top-cheftable');
        else if (elementName === 'cheftable-china') element = document.querySelector('#china-stage .top-cheftable');
        else if (elementName === 'card-napkin-japan') element = document.querySelector('#japan-stage .card-napkin');
        else if (elementName === 'card-napkin-china') element = document.querySelector('#china-stage .card-napkin');
        else if (elementName === 'japan-dish-3') element = document.querySelector('#japan-stage .japan-dish-3');
        else if (elementName === 'japan-dish-4') element = document.querySelector('#japan-stage .japan-dish-4');
        else if (elementName === 'japan-dish-5') element = document.querySelector('#japan-stage .japan-dish-5');
        else if (elementName === 'spoonspot-1') element = document.querySelector('#japan-stage #spoonspot-1');
        else if (elementName === 'spoonspot-2') element = document.querySelector('#japan-stage #spoonspot-2');
        else if (elementName === 'spoonspot-image') element = document.querySelector('#japan-stage .spoonspot-image');
        else if (elementName === 'shadow-dish2') element = document.querySelector('#japan-stage .shadow-dish2');
        else if (elementName === 'shadow-dish3') element = document.querySelector('#japan-stage .shadow-dish3');
        else if (elementName === 'shadow-dish4') element = document.querySelector('#japan-stage .shadow-dish4');
        else if (elementName === 'shadow-dish5') element = document.querySelector('#japan-stage .shadow-dish5');
        else if (elementName === 'shadow-dish') element = document.querySelector('#japan-stage .shadow-dish');
        else if (elementName === 'shadow-spoon') element = document.querySelector('#japan-stage .shadow-spoon');
        else if (elementName === 'shadow-chopsticks') element = document.querySelector('#japan-stage .shadow-chopsticks');
        else if (elementName.startsWith('dropped-')) {
            // 드롭된 아이템은 동적으로 생성되므로 나중에 적용
            return;
        }
        else if (elementName === 'cheftable-rice-bowl-japan') element = document.querySelector('#japan-stage .cheftable-rice-bowl');
        else if (elementName === 'cheftable-rice-bowl-china') element = document.querySelector('#china-stage .cheftable-rice-bowl');
        else if (elementName === 'drop-zone-rice-bowl-japan') element = document.querySelector('#japan-stage #drop-rice-bowl');
        else if (elementName === 'drop-zone-spoon-japan') element = document.querySelector('#japan-stage #drop-spoon');
        else if (elementName === 'drop-zone-chopsticks-japan') element = document.querySelector('#japan-stage #drop-chopsticks');
        else if (elementName === 'drop-zone-chopsticks-2-japan') element = document.querySelector('#japan-stage #drop-chopsticks-2');
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
            // 위치가 유효한 경우에만 적용
            if (position.x !== undefined && position.x !== null &&
                position.y !== undefined && position.y !== null) {
                // 그림자 이미지는 left/top을 직접 설정
                if (element.classList.contains('image-shadow')) {
                    element.style.left = `${position.x}vw`;
                    element.style.top = `${position.y}vw`;
                    // transform은 translate 오프셋과 회전값을 포함
                    const shadowOffsetX = -3;
                    const shadowOffsetY = 6;
                    if (position.rotation !== undefined && position.rotation !== 0) {
                        element.style.transform = `rotate(${position.rotation}deg) translate(${shadowOffsetX}vw, ${shadowOffsetY}vw)`;
                    } else {
                        element.style.transform = `translate(${shadowOffsetX}vw, ${shadowOffsetY}vw)`;
                    }
                    // 크기도 적용 (부모 요소와 img 요소 모두)
                    if (position.size !== undefined) {
                        element.style.width = `${position.size}vw`;
                        const shadowImg = element.querySelector('img');
                        if (shadowImg) {
                            // 이미지 비율 유지
                            if (shadowImg.naturalWidth > 0 && shadowImg.naturalHeight > 0) {
                                const aspectRatio = shadowImg.naturalHeight / shadowImg.naturalWidth;
                                const heightVw = position.size * aspectRatio;
                                element.style.height = `${heightVw}vw`;
                                shadowImg.style.width = `${position.size}vw`;
                                shadowImg.style.height = `${heightVw}vw`;
                            } else {
                                shadowImg.onload = function () {
                                    const aspectRatio = this.naturalHeight / this.naturalWidth;
                                    const heightVw = position.size * aspectRatio;
                                    element.style.height = `${heightVw}vw`;
                                    this.style.width = `${position.size}vw`;
                                    this.style.height = `${heightVw}vw`;
                                };
                                shadowImg.style.width = `${position.size}vw`;
                            }
                        }
                    }
                } else if (element.classList.contains('top-cheftable')) {
                    // 셰프테이블은 CSS에서 left: 50%와 transform: translateX(-50%)를 사용하므로
                    // 저장된 위치를 적용할 때 transform을 초기화하고 left를 vw로 설정
                    element.style.left = `${position.x}vw`;
                    element.style.top = `${position.y}vw`;
                    element.style.transform = 'none'; // 기본 transform 제거
                } else {
                    element.style.left = `${position.x}vw`;
                    element.style.top = `${position.y}vw`;
                }
            }

            // 드랍존의 경우 transform과 margin 초기화 (저장된 위치 사용 시)
            if (element.classList.contains('drop-zone')) {
                // 저장된 위치가 있으면 기본 transform과 margin 제거
                if (elementName === 'drop-zone-spoon-japan') {
                    element.style.marginLeft = '';
                } else if (elementName === 'drop-zone-chopsticks-japan') {
                    element.style.marginTop = '';
                    element.style.marginLeft = '';
                    // 젓가락 드랍존 회전 제거
                    if (!position.rotation) {
                        element.style.transform = 'none';
                        element.style.transformOrigin = '';
                    }
                } else if (elementName === 'drop-zone-chopsticks-2-japan') {
                    element.style.marginTop = '';
                    element.style.marginLeft = '';
                    // 젓가락 드랍존 2 회전 제거
                    if (!position.rotation) {
                        element.style.transform = 'none';
                        element.style.transformOrigin = '';
                    }
                }
            }

            // 크기 적용 (card-napkin은 크기 조정 불가, 그림자 이미지는 이미 위에서 적용됨)
            if (position.size && !element.classList.contains('card-napkin') && !element.classList.contains('image-shadow')) {
                updateElementSize(element, position.size);
            }

            // 회전 적용 (그림자 이미지는 이미 transform에 회전값이 포함되어 있으므로 건너뜀)
            if (position.rotation !== undefined && !element.classList.contains('image-shadow')) {
                updateElementRotation(element, position.rotation);
            }
        }
    });

    // 그림자 위치 동기화
    syncShadowPositions();
}

// 디버그 위치 초기화
function resetDebugPosition(element) {
    let elementName = '';
    const id = element.id;
    const classList = element.classList;

    if (id === 'grab-image') elementName = 'grab-image';
    // 중국 스테이지 요소 매핑 업데이트
    else if (classList.contains('setting-spoon')) elementName = 'cn-spoon';
    else if (classList.contains('setting-chopsticks')) elementName = 'cn-chopstick';
    else if (classList.contains('setting-bowl')) elementName = 'cn-rice';
    else if (classList.contains('setting-plate')) elementName = 'cn-dish';
    else if (classList.contains('setting-tea-pot')) elementName = 'cn-teapot';
    else if (classList.contains('setting-tea-cup')) elementName = 'cn-cup';
    else if (classList.contains('setting-mat')) elementName = 'cn-mat';
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
    else if (classList.contains('japan-dish-3')) elementName = 'japan-dish-3';
    else if (classList.contains('japan-dish-4')) elementName = 'japan-dish-4';
    else if (classList.contains('japan-dish-5')) elementName = 'japan-dish-5';
    else if (classList.contains('spoonspot-image')) {
        elementName = element.id || 'spoonspot-image';
    }
    else if (classList.contains('image-shadow')) {
        // 그림자 이미지는 클래스명으로 식별
        if (classList.contains('shadow-dish2')) elementName = 'shadow-dish2';
        else if (classList.contains('shadow-dish3')) elementName = 'shadow-dish3';
        else if (classList.contains('shadow-dish4')) elementName = 'shadow-dish4';
        else if (classList.contains('shadow-dish5')) elementName = 'shadow-dish5';
        else if (classList.contains('shadow-dish')) elementName = 'shadow-dish';
        else if (classList.contains('shadow-spoon')) elementName = 'shadow-spoon';
        else if (classList.contains('shadow-chopsticks')) elementName = 'shadow-chopsticks';
        else elementName = 'image-shadow';
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
        // drop-chopsticks-2는 별도로 처리
        if (id === 'drop-chopsticks-2') {
            const stage = element.closest('#japan-stage, #china-stage');
            const stageName = stage && stage.id === 'china-stage' ? '-china' : '-japan';
            elementName = `drop-zone-chopsticks-2${stageName}`;
        } else {
            const itemType = element.getAttribute('data-item');
            const stage = element.closest('#japan-stage, #china-stage');
            const stageName = stage && stage.id === 'china-stage' ? '-china' : '-japan';
            elementName = `drop-zone-${itemType}${stageName}`;
        }
    }

    if (!elementName || elementName === '알 수 없음') return;

    // 기본 위치로 복원 (CSS에서 정의된 기본값)
    delete debugPositions[elementName];
    localStorage.setItem('debugPositions', JSON.stringify(debugPositions));

    // CSS 기본값으로 복원 (중국 스테이지 요소들)
    if (elementName === 'cn-spoon') {
        element.style.top = '10%';
        element.style.left = '20%';
    } else if (elementName === 'cn-chopstick') {
        element.style.bottom = '10%';
        element.style.left = '38%';
    } else if (elementName === 'cn-rice') {
        element.style.bottom = '25%';
        element.style.left = '32%';
    } else if (elementName === 'cn-dish') {
        element.style.bottom = '10%';
        element.style.left = '20%';
    } else if (elementName === 'cn-teapot') {
        element.style.bottom = '15%';
        element.style.right = '25%';
    } else if (elementName === 'cn-cup') {
        element.style.bottom = '10%';
        element.style.right = '40%';
    } else if (elementName === 'cn-mat') {
        element.style.bottom = '5%';
        element.style.left = '15%';
    } else if (elementName === 'cn-table1') {
        element.style.top = '-40%';
        element.style.left = '50%';
    } else if (elementName === 'cn-table2') {
        element.style.left = '50%';
        element.style.top = '50%';
    }

    // 드랍존의 경우 스타일 제거하여 기본값으로 복원
    if (element.classList.contains('drop-zone')) {
        element.style.left = '';
        element.style.top = '';
    } else {
        // 크기도 기본값(80%)으로 복원
        const resetImg = element.querySelector('img');
        if (resetImg) {
            // 크기 복원 로직은 복잡하므로 단순히 스타일 제거
            element.style.width = '';
            element.style.height = '';
            resetImg.style.width = '100%';
            resetImg.style.height = '100%';
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

// 모든 이미지 로드 완료 대기 함수
function waitForAllImages(callback) {
    const images = document.querySelectorAll('img');
    let loadedCount = 0;
    const totalImages = images.length;

    if (totalImages === 0) {
        callback();
        return;
    }

    const checkComplete = () => {
        loadedCount++;
        if (loadedCount === totalImages) {
            callback();
        }
    };

    images.forEach(img => {
        if (img.complete && img.naturalWidth > 0) {
            checkComplete();
        } else {
            img.onload = checkComplete;
            img.onerror = checkComplete; // 에러가 나도 진행
        }
    });
}

// 페이지 로드 시 디버그 모드 초기화
window.addEventListener('DOMContentLoaded', () => {
    initializeDebugMode();
    // 모든 이미지 로드 완료 후 위치 적용
    waitForAllImages(() => {
        setTimeout(() => {
            applyDebugPositions();
            syncShadowPositions();
        }, 100);
    });
});

// 말풍선 숨기기
function hideSpeechBubble() {
    const speechBubble = document.getElementById('speech-bubble');
    const nextBtn = document.getElementById('next-speech-btn');

    // 자동 숨김 타이머 취소
    if (currentSpeechBubbleTimeout) {
        clearTimeout(currentSpeechBubbleTimeout);
        currentSpeechBubbleTimeout = null;
    }

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

