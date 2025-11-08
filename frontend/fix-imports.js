// Używamy składni 'import' zamiast 'require'
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// --- Mapa poprawek (TA SAMA CO WCZEŚNIEJ) ---
const fileFixes = {
  // Błąd w Dashboard.jsx: ../context/ApiContext -> ../../context/ApiContext
  // ORAZ wszystkie błędne importy "../components/"
  'src/Components/dashboard/Dashboard.jsx': [
    {
      find: "from '../context/ApiContext'",
      replace: "from '../../context/ApiContext'"
    },
    {
      find: 'from "../components/dashboard/DailyChallenge.jsx"',
      replace: 'from "./DailyChallenge.jsx"'
    },
    {
      find: 'from "../components/dashboard/DashboardHeader.jsx"',
      replace: 'from "./DashboardHeader.jsx"'
    },
    {
      find: 'from "../components/dashboard/QuickActions.jsx"',
      replace: 'from "./QuickActions.jsx"'
    },
    {
      find: 'from "../components/dashboard/FriendActivityFeed.jsx"',
      replace: 'from "./FriendActivityFeed.jsx"'
    },
    // Pliki, które są w /dashboard/ (wg screena) ale były importowane z /exercise/
    {
      find: 'from "../components/exercise/ExerciseFilterSidebar.jsx"',
      replace: 'from "./ExerciseFilterSidebar.jsx"'
    },
    {
      find: 'from "../components/exercise/ExerciseList.jsx"',
      replace: 'from "./ExerciseList.jsx"'
    },
    // Plik, który jest w /collections/ (wg screena)
    {
      find: 'from "../components/collections/CollectionList.jsx"',
      replace: 'from "../collections/CollectionList.jsx"' // Ten był prawie dobrze, tylko usuwamy "components"
    },
    // Plik, który jest w /ui/ (wg screena)
    {
      find: 'from "../components/ui/RankedWarningModal.jsx"',
      replace: 'from "../ui/RankedWarningModal.jsx"'
    }
  ],

  // Błąd w CalibrationSession.jsx: ./readingUtils.js -> ../../utils/readingUtils.js
  'src/Components/dashboard/CalibrationSession.jsx': [
    {
      find: 'from "./readingUtils.js"',
      replace: 'from "../../utils/readingUtils.js"'
    }
  ],

  // Błąd w TrainingSession.jsx: ./reader/HighlightReader.jsx -> ./HighlightReader.jsx (i inne)
  'src/Components/reader/TrainingSession.jsx': [
    {
      find: 'from "./reader/HighlightReader.jsx"',
      replace: 'from "./HighlightReader.jsx"'
    },
    {
      find: 'from "./reader/RSVPReader.jsx"',
      replace: 'from "./RSVPReader.jsx"'
    },
    {
      find: 'from "./reader/ChunkingReader.jsx"',
      replace: 'from "./ChunkingReader.jsx"'
    },
    {
      find: 'from "./ui/CheatPopup.jsx"',
      replace: 'from "../ui/CheatPopup.jsx"'
    }
  ],

  // Błąd w DashboardHeader.jsx: ./NotificationBell.jsx -> ../ui/NotificationBell.jsx
  'src/Components/dashboard/DashboardHeader.jsx': [
    {
      find: 'from "./NotificationBell.jsx"',
      replace: 'from "../ui/NotificationBell.jsx"'
    }
  ],
  
  // Poprawki dla hooków (z logów błędów). Dodajemy .jsx na wszelki wypadek.
  'src/hooks/useDashboardData.js': [
    {
      find: "from '../context/ApiContext'",
      replace: "from '../context/ApiContext.jsx'" // Poprawna ścieżka, ale dodajemy rozszerzenie
    }
  ],
  'src/hooks/useExerciseFilters.js': [
    {
      find: "from '../context/ApiContext'",
      replace: "from '../context/ApiContext.jsx'" // Poprawna ścieżka, ale dodajemy rozszerzenie
    }
  ]
};
// --- Koniec mapy poprawek ---


// --- Logika skryptu (zaktualizowana dla ES Modules) ---

// Musimy odtworzyć '__dirname', którego nie ma w ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fixImports() {
  console.log('--- Rozpoczynam naprawę importów (tryb ES Module) ---');
  let filesChanged = 0;
  const projectRoot = __dirname; // Teraz to działa poprawnie

  for (const relativePath in fileFixes) {
    const filePath = path.join(projectRoot, relativePath);
    const fixes = fileFixes[relativePath];

    try {
      let content = await fs.readFile(filePath, 'utf-8');
      let originalContent = content;

      for (const fix of fixes) {
        // Używamy replaceAll, aby naprawić wielokrotne wystąpienia
        content = content.replaceAll(fix.find, fix.replace);
      }

      if (originalContent !== content) {
        await fs.writeFile(filePath, content, 'utf-8');
        console.log(`✅ Naprawiono plik: ${relativePath}`);
        filesChanged++;
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.error(`❌ BŁĄD: Nie znaleziono pliku: ${relativePath}`);
      } else {
        console.error(`❌ BŁĄD podczas przetwarzania ${relativePath}: ${error.message}`);
      }
    }
  }

  if (filesChanged > 0) {
    console.log(`\n--- Ukończono! Naprawiono ${filesChanged} plików. ---`);
    console.log('Możesz teraz ponownie uruchomić "npm run dev".');
  } else {
    console.log('\n--- Ukończono! Nie znaleziono nic do naprawy (możliwe, że pliki zostały już naprawione). ---');
  }
}

fixImports();