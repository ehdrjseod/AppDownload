const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 파일 저장 디렉토리 생성
const uploadsDir = path.join(__dirname, 'uploads');
const androidDir = path.join(uploadsDir, 'android');
const iosDir = path.join(uploadsDir, 'ios');

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
if (!fs.existsSync(androidDir)) fs.mkdirSync(androidDir);
if (!fs.existsSync(iosDir)) fs.mkdirSync(iosDir);

// 파일 저장 설정
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (req.path.includes('/android')) {
            cb(null, androidDir);
        } else if (req.path.includes('/ios')) {
            cb(null, iosDir);
        }
    },
    filename: (req, file, cb) => {
        // 파일 확장자에 따라 파일명 설정
        let filename;
        if (file.fieldname === 'androidFile') {
            filename = `app${path.extname(file.originalname)}`;
        } else if (file.fieldname === 'ipaFile') {
            filename = `app.ipa`;
        } else if (file.fieldname === 'plistFile') {
            filename = `app.plist`;
        }
        cb(null, filename);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (req.path.includes('/android')) {
            if (file.mimetype === 'application/vnd.android.package-archive' ||
                file.originalname.endsWith('.aab')) {
                cb(null, true);
            } else {
                cb(new Error('Android 파일만 업로드 가능합니다 (APK, AAB)'));
            }
        } else if (req.path.includes('/ios')) {
            if (file.fieldname === 'ipaFile' && file.originalname.endsWith('.ipa')) {
                cb(null, true);
            } else if (file.fieldname === 'plistFile' && file.originalname.endsWith('.plist')) {
                cb(null, true);
            } else {
                cb(new Error('IPA 또는 PLIST 파일만 업로드 가능합니다'));
            }
        }
    }
});

// 라우트
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 안드로이드 파일 업로드
app.post('/upload/android', upload.single('androidFile'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '파일이 업로드되지 않았습니다' });
        }
        res.json({ message: '안드로이드 앱이 성공적으로 업로드되었습니다' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PLIST 파일 생성 함수
function generatePlist(appName, bundleId, version, ipaUrl) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>items</key>
    <array>
        <dict>
            <key>assets</key>
            <array>
                <dict>
                    <key>kind</key>
                    <string>software-package</string>
                    <key>url</key>
                    <string>${ipaUrl}</string>
                </dict>
            </array>
            <key>metadata</key>
            <dict>
                <key>bundle-identifier</key>
                <string>${bundleId}</string>
                <key>bundle-version</key>
                <string>${version}</string>
                <key>kind</key>
                <string>software</string>
                <key>title</key>
                <string>${appName}</string>
            </dict>
        </dict>
    </array>
</dict>
</plist>`;
}

// 아이폰 파일 업로드
app.post('/upload/ios',
    upload.fields([
        { name: 'ipaFile', maxCount: 1 },
        { name: 'plistFile', maxCount: 1 }
    ]),
    (req, res) => {
        try {
            if (!req.files || !req.files.ipaFile) {
                return res.status(400).json({ error: 'IPA 파일은 필수입니다' });
            }

            // PLIST 파일이 제공되지 않은 경우 자동 생성
            if (!req.files.plistFile && req.body.autoGeneratePlist === 'true') {
                // 배열로 들어온 경우 첫 번째 값만 사용
                const appName = Array.isArray(req.body.appName) ? req.body.appName[0] : (req.body.appName || 'My App');
                const bundleId = Array.isArray(req.body.bundleId) ? req.body.bundleId[0] : (req.body.bundleId || 'com.example.app');
                const version = Array.isArray(req.body.version) ? req.body.version[0] : (req.body.version || '1.0.0');

                // IPA 파일의 URL 생성 (서버의 호스트 정보를 기반으로)
                const protocol = req.protocol;
                const host = req.get('host');
                const ipaUrl = `${protocol}://${host}/download/ios-ipa`;

                // PLIST 내용 생성
                const plistContent = generatePlist(appName.trim(), bundleId.trim(), version.trim(), ipaUrl);

                // PLIST 파일 저장
                const plistPath = path.join(iosDir, 'app.plist');
                fs.writeFileSync(plistPath, plistContent, 'utf8');
            } else if (!req.files.plistFile) {
                return res.status(400).json({ error: 'PLIST 파일을 선택하거나 자동 생성 정보를 입력해주세요' });
            }

            res.json({ message: '아이폰 앱이 성공적으로 업로드되었습니다' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

// 안드로이드 파일 다운로드
app.get('/download/android', (req, res) => {
    const files = fs.readdirSync(androidDir);
    if (files.length === 0) {
        return res.status(404).json({ error: '안드로이드 앱 파일이 없습니다' });
    }

    const file = files[0];
    const filePath = path.join(androidDir, file);
    res.download(filePath, file);
});

// 아이폰 PLIST 파일 제공 (다운로드가 아닌 내용 전송)
app.get('/download/ios', (req, res) => {
    const files = fs.readdirSync(iosDir);
    const plistFile = files.find(file => file.endsWith('.plist'));

    if (!plistFile) {
        return res.status(404).json({ error: '아이폰 앱 PLIST 파일이 없습니다' });
    }

    const plistPath = path.join(iosDir, plistFile);
    // PLIST를 XML로 전송 (iOS가 읽을 수 있도록)
    res.type('application/xml');
    res.sendFile(plistPath);
});

// 아이폰 IPA 파일 다운로드 (PLIST에서 참조용)
app.get('/download/ios-ipa', (req, res) => {
    const files = fs.readdirSync(iosDir);
    const ipaFile = files.find(file => file.endsWith('.ipa'));

    if (!ipaFile) {
        return res.status(404).json({ error: '아이폰 앱 IPA 파일이 없습니다' });
    }

    const ipaPath = path.join(iosDir, ipaFile);
    res.download(ipaPath, ipaFile);
});

// 파일 존재 여부 확인
app.get('/check/android', (req, res) => {
    const files = fs.readdirSync(androidDir);
    if (files.length > 0) {
        res.json({ exists: true });
    } else {
        res.status(404).json({ exists: false });
    }
});

app.get('/check/ios', (req, res) => {
    const files = fs.readdirSync(iosDir);
    const hasPlist = files.some(file => file.endsWith('.plist'));
    const hasIpa = files.some(file => file.endsWith('.ipa'));

    if (hasPlist && hasIpa) {
        res.json({ exists: true });
    } else {
        res.status(404).json({ exists: false });
    }
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT}에서 실행중입니다`);
});
