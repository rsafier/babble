/**
 * Scrabble Dictionary
 * Contains a set of valid words for the Scrabble game
 */

// A small dictionary of common English words for the Scrabble game
const dictionary = new Set([
  // 2-letter words
  "aa", "ab", "ad", "ae", "ag", "ah", "ai", "al", "am", "an", "ar", "as", "at", "aw", "ax", "ay",
  "ba", "be", "bi", "bo", "by",
  "de", "do",
  "ed", "ef", "eh", "el", "em", "en", "er", "es", "et", "ex",
  "fa", "fe", "go",
  "ha", "he", "hi", "hm", "ho",
  "id", "if", "in", "is", "it",
  "jo",
  "ka", "ki",
  "la", "li", "lo",
  "ma", "me", "mi", "mm", "mo", "mu", "my",
  "na", "ne", "no", "nu",
  "od", "oe", "of", "oh", "oi", "om", "on", "op", "or", "os", "ow", "ox", "oy",
  "pa", "pe", "pi", "po",
  "qi",
  "re",
  "sh", "si", "so",
  "ta", "ti", "to",
  "uh", "um", "un", "up", "us", "ut",
  "we", "wo",
  "xi", "xu",
  "ya", "ye", "yo",
  "za",

  // Common 3-letter words
  "ace", "act", "add", "ado", "age", "ago", "aid", "aim", "air", "ale", "all", "and", "ant", "any", "ape", "apt", "arc", "are", "ark", "arm", "art", "ash", "ask", "ate", "awe", "awl", "aye",
  "bad", "bag", "ban", "bar", "bat", "bay", "bed", "bee", "beg", "bet", "bid", "big", "bin", "bit", "bog", "bon", "boo", "bow", "box", "boy", "bud", "bug", "bum", "bun", "bus", "but", "buy", "bye",
  "cab", "cad", "cam", "can", "cap", "car", "cat", "caw", "cay", "cob", "cod", "cog", "con", "coo", "cop", "cor", "cow", "coy", "cry", "cub", "cud", "cue", "cup", "cut",
  "dab", "dad", "dam", "day", "den", "dew", "did", "die", "dig", "dim", "din", "dip", "doe", "dog", "don", "dot", "dry", "dub", "due", "dug", "dun", "duo",
  "ear", "eat", "ebb", "egg", "ego", "eke", "elf", "elk", "elm", "end", "era", "err", "eve", "ewe", "eye",
  "fab", "fad", "fan", "far", "fat", "fax", "fee", "fen", "few", "fib", "fig", "fin", "fir", "fit", "fix", "foe", "fog", "for", "fox", "fry", "fun", "fur",
  
  // Common 4-letter words
  "able", "ably", "acid", "aged", "also", "area", "army", "away",
  "baby", "back", "ball", "band", "bank", "base", "bath", "bear", "beat", "been", "beer", "bell", "belt", "best", "bird", "bite", "blue", "boat", "body", "bone", "book", "born", "both", "bowl", "bulk", "burn", "bush", "busy", "butt",
  "cake", "call", "calm", "came", "camp", "card", "care", "case", "cash", "cast", "cell", "chat", "chip", "city", "club", "coal", "coat", "code", "cold", "come", "cook", "cool", "cope", "copy", "core", "cost", "crew", "crop",
  "dark", "data", "date", "dawn", "days", "dead", "deal", "dear", "debt", "deep", "deny", "desk", "dial", "diet", "dirt", "disc", "disk", "does", "done", "door", "dose", "down", "draw", "drop", "drug", "dual", "duke", "dust", "duty",
  
  // Common 5-letter words
  "about", "above", "abuse", "actor", "adapt", "added", "admit", "adopt", "adult", "after", "again", "agent", "agree", "ahead", "alarm", "album", "alert", "alike", "alive", "allow", "alone", "along", "alter", "among", "anger", "angle", "angry", "anime", "ankle", "apart", "apple", "apply", "arena", "argue", "arise", "armor", "array", "arrow", "asset", "avoid", "award", "aware", "awful",
  "bacon", "badge", "badly", "baker", "bases", "basic", "basis", "beach", "beard", "beast", "begin", "being", "below", "bench", "berry", "birth", "black", "blade", "blame", "blank", "blast", "bleed", "blend", "bless", "blind", "block", "blood", "bloom", "blues", "bluff", "board", "boast", "bonus", "boost", "booth", "born", "bound", "brace", "brain", "brake", "brand", "brave", "bread", "break", "breed", "brick", "bride", "brief", "bring", "broad", "brown", "brush", "build", "built", "bunch", "burst", "cabin",
  
  // Common longer words
  "abandon", "ability", "absence", "academy", "account", "accuse", "achieve", "acquire", "address", "advance", "adverse", "advice", "advise", "affair", "affect", "afford", "afraid", "agency", "agenda", "airline", "airport", "alcohol", "allegation", "alliance", "allocate", "already", "although", "altitude", "amazing", "ambition", "amount", "analyze", "ancestor", "ancient", "animal", "announce", "annual", "another", "answer", "anxiety", "anybody", "anymore", "anyone", "anything", "anyway", "anywhere", "apartment", "apparent", "appeal", "appear", "apple", "apply", "appoint", "approach", "approve", "architect", "archive", "argument", "around", "arrange", "arrest", "arrival", "article", "artist", "artwork", "aspect", "assault", "assert", "assess", "asset", "assign", "assist", "assume", "assure", "athlete", "atmosphere", "attach", "attack", "attempt", "attend", "attention", "attitude", "attorney", "attract", "auction", "audience", "author", "authority", "available", "average", "aviation",
  "balance", "balloon", "ballot", "banana", "banking", "bargain", "barrier", "baseball", "basic", "basket", "battery", "battle", "beach", "beauty", "because", "become", "bedroom", "before", "begin", "behavior", "behind", "believe", "belong", "benefit", "better", "between", "beyond", "bicycle", "billion", "biology", "birthday", "bishop", "black", "blade", "blame", "blanket", "blessing", "block", "blood", "board", "border", "borrow", "bottle", "bottom", "boundary", "bracket", "brain", "branch", "brand", "bread", "break", "breakfast", "breast", "breath", "breeze", "brick", "bridge", "brief", "bright", "bring", "british", "broad", "broken", "brother", "brown", "brush", "budget", "build", "building", "bullet", "bunch", "burden", "bureau", "business", "butter", "button", "buyer",
  "cabin", "cable", "calculate", "calendar", "camera", "campaign", "campus", "canal", "cancel", "cancer", "candidate", "candle", "candy", "canvas", "capable", "capacity", "capital", "captain", "capture", "carbon", "career", "careful", "cargo", "carpet", "carrier", "carry", "cartoon", "carve", "casino", "castle", "casual", "category", "cattle", "caution", "ceiling", "celebrate", "celebrity", "center", "central", "century", "ceremony", "certain", "chain", "chair", "chairman", "challenge", "chamber", "champion", "chance", "change", "channel", "chapter", "character", "charge", "charity", "charm", "chart", "charter", "chase", "cheap", "check", "cheese", "chemical", "chest", "chicken", "chief", "child", "childhood", "chocolate", "choice", "choose", "church", "circle", "circuit", "circumstance", "citizen", "civil", "claim", "class", "classic", "classroom", "clean", "clear", "clerk", "click", "client", "climate", "clinic", "clock", "close", "closet", "clothes", "cloud", "cluster", "coach", "coast", "coffee", "cognitive", "collect", "college", "colony", "color", "column", "comedy", "comfort", "command", "comment", "commerce", "commission", "commit", "committee", "common", "community", "company", "compare", "compete", "complain", "complete", "complex", "comply", "component", "compose", "computer", "concept", "concern", "concert", "conclude", "condition", "conduct", "conference", "confidence", "confirm", "conflict", "confront", "confusion", "congress", "connect", "connection", "conscience", "conscious", "consensus", "consent", "consequence", "conservation", "consider", "consist", "conspiracy", "constant", "constitute", "constraint", "construct", "consult", "consumer", "contact", "contain", "content", "contest", "context", "continue", "contract", "contrast", "contribute", "control", "controversy", "convenience", "convention", "conversation", "convert", "convince", "cookie", "cooking", "cooperate", "coordinate", "copper", "corner", "corporate", "correct", "corridor", "corrupt", "cotton", "couch", "council", "counsel", "count", "counter", "country", "county", "couple", "courage", "course", "court", "cousin", "cover", "crack", "craft", "crash", "crazy", "cream", "create", "creation", "creative", "creature", "credit", "crime", "criminal", "crisis", "criteria", "critic", "critical", "criticism", "criticize", "cross", "crowd", "crucial", "cruise", "crystal", "cultural", "culture", "curious", "currency", "current", "curtain", "curve", "custody", "custom", "customer", "cycle"
]);

// Export the dictionary
module.exports = {
  dictionary,
  
  // Check if a word is valid
  isValidWord: (word) => dictionary.has(word.toLowerCase()),
  
  // Add words to the dictionary (for testing or expansion)
  addWord: (word) => {
    dictionary.add(word.toLowerCase());
  },
  
  // Get the size of the dictionary
  getSize: () => dictionary.size
};
