import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: 'en',
        debug: false,
        interpolation: {
            escapeValue: false,
        },
        resources: {
            en: {
                translation: {
                    nav: {
                        home: 'Home',
                        buy: 'Buy',
                        rent: 'Rent',
                        favorites: 'Favorites',
                        sell: 'List Estate',
                        my_properties: 'My Dashboard',
                        dashboard: 'Dashboard',
                        sign_out: 'Sign Out',
                        sign_in: 'Sign In',
                        register: 'Register',
                        language: 'Language'
                    },
                    home: {
                        hero_title: 'Find Your Private Sanctuary.',
                        hero_subtitle: 'Curating the world\'s most exceptional properties for those who value architectural brilliance and ultimate privacy.',
                        stats: {
                            market_volume: 'Market Volume',
                            private_clients: 'Private Clients',
                            avg_appreciation: 'Avg Appreciation'
                        },
                        experience: {
                            lifestyle: 'The Lifestyle',
                            redefining: 'Redefining The Modern Legacy.',
                            subtitle: 'More than just a property search. EstateHub is a portal into a refined lifestyle where architecture meets soul.',
                            features: {
                                ai_matching: 'AI-Powered Matching',
                                ai_desc: 'Global algorithms to match your lifestyle DNA with perfect architectures.',
                                verification: 'Institutional Verification',
                                verification_desc: 'Secure blockchain-inspired verification for absolute legal transparency.',
                                concierge: 'Direct Concierge',
                                concierge_desc: 'Bypass intermediaries. Direct encrypted links to world-class estate admins.'
                            }
                        },
                        testimonials: {
                            title: 'Voices of Distinction',
                            items: [
                                { role: 'Architectural Director', text: "EstateHub has fundamentally changed how we showcase our projects. The quality and high-intent leads are unparalleled." },
                                { role: 'Luxury Portfolio Client', text: "I found my beachside sanctuary in Goa within 48 hours. The verification process gave me absolute peace of mind." },
                                { role: 'Real Estate Developer', text: "The most professional platform I've used. The interface is stunning and the user experience is designed for high-value transactions." }
                            ]
                        }
                    },
                    properties: {
                        title: 'Find Your Perfect Home',
                        subtitle: 'Browse our exclusive collection of premium properties across the country.',
                        search_placeholder: 'Search properties...',
                        all_assets: 'All Assets',
                        buy_property: 'Buy Property',
                        rent_property: 'Rent Property',
                        location: 'Location',
                        all_cities: 'All Cities',
                        type: 'Type',
                        all_types: 'All Types',
                        price: 'Price',
                        min_price: 'Min',
                        max_price: 'Max',
                        beds: 'Beds',
                        any_beds: 'Any',
                        sort: 'Sort',
                        newest_first: 'Newest First',
                        price_low_to_high: 'Price: Low to High',
                        price_high_to_low: 'Price: High to Low',
                        showing: 'Showing',
                        luxury_properties: 'luxury properties',
                        load_more: 'Load More Properties'
                    },
                    chatbot: {
                        welcome: 'Hello! Welcome to EstateHub. How can I assist you with your premium property search today?',
                        placeholder: 'How can we help today?',
                        status: 'Online Concierge',
                        responses: {
                            prices: 'Property prices on EstateHub range from premium apartments at $500k to exclusive villas exceeding $10M. Would you like to see our most expensive listings?',
                            contact: 'To contact an admin, please navigate to the property detail page and use the "Request Exclusive View" form on the right sidebar. Our admins respond within 12 hours.',
                            location: 'We have listings in major cities including Bangalore, London, Dubai, and Mumbai. Use the search bar in the marketplace to filter by city.',
                            hello: "Hi there! I'm your EstateHub AI Assistant. I can help you find properties, explain our services, or guide you to contact admins.",
                            fallback: "That's an interesting question! I'm still learning, but I can definitely help you navigate our luxury portfolio. Would you like to browse our latest properties?"
                        }
                    }
                }
            },
            hi: {
                translation: {
                    nav: {
                        home: 'होम',
                        buy: 'खरीदें',
                        rent: 'किराया',
                        favorites: 'पसंदीदा',
                        sell: 'संपत्ति सूचीबद्ध करें',
                        my_properties: 'मेरा डैशबोर्ड',
                        dashboard: 'डैशबोर्ड',
                        sign_out: 'साइन आउट',
                        sign_in: 'साइन इन',
                        register: 'पंजीकरण',
                        language: 'भाषा'
                    },
                    home: {
                        hero_title: 'अपना निजी अभयारण्य खोजें।',
                        hero_subtitle: 'वास्तुकला प्रतिभा और परम गोपनीयता को महत्व देने वालों के लिए दुनिया की सबसे असाधारण संपत्तियों का चयन।',
                        stats: {
                            market_volume: 'बाजार मात्रा',
                            private_clients: 'निजी ग्राहक',
                            avg_appreciation: 'औसत प्रशंसा'
                        },
                        experience: {
                            lifestyle: 'जीवनशैली',
                            redefining: 'आधुनिक विरासत को पुनर्परिभाषित करना।',
                            subtitle: 'सिर्फ एक संपत्ति खोज से अधिक। एस्टेटहब एक परिष्कृत जीवनशैली का पोर्टल है जहां वास्तुकला आत्मा से मिलती है।',
                            features: {
                                ai_matching: 'एआई-पावर्ड मैचिंग',
                                ai_desc: 'आपकी जीवनशैली डीएनए को सही वास्तुकला के साथ मिलाने के लिए वैश्विक एल्गोरिदम।',
                                verification: 'संस्थागत सत्यापन',
                                verification_desc: 'पूर्ण कानूनी पारदर्शिता के लिए सुरक्षित ब्लॉकचेन-प्रेरित सत्यापन।',
                                concierge: 'प्रत्यक्ष द्वारपाल',
                                concierge_desc: 'बिचौलियों को बायपास करें। विश्व स्तरीय एस्टेट व्यवस्थापकों के लिए प्रत्यक्ष एन्क्रिप्टेड लिंक।'
                            }
                        },
                        testimonials: {
                            title: 'विशिष्टता की आवाजें',
                            items: [
                                { role: 'वास्तुकला निदेशक', text: "एस्टेटहब ने मौलिक रूप से बदल दिया है कि हम अपनी परियोजनाओं को कैसे प्रदर्शित करते हैं। गुणवत्ता और उच्च-इरादे वाले लीड अद्वितीय हैं।" },
                                { role: 'लक्जरी पोर्टफोलियो क्लाइंट', text: "मुझे 48 घंटों के भीतर गोवा में अपना समुद्र तटीय अभयारण्य मिल गया। सत्यापन प्रक्रिया ने मुझे पूर्ण शांति प्रदान की।" },
                                { role: 'रियल एस्टेट डेवलपर', text: "मैंने अब तक का सबसे पेशेवर मंच उपयोग किया है। इसका इंटरफ़ेस शानदार है और उपयोगकर्ता अनुभव उच्च-मूल्य वाले लेनदेन के लिए डिज़ाइन किया गया है।" }
                            ]
                        }
                    },
                    properties: {
                        title: 'अपना आदर्श घर खोजें',
                        subtitle: 'देश भर में प्रीमियम संपत्तियों के हमारे विशेष संग्रह को ब्राउज़ करें।',
                        search_placeholder: 'संपत्तियां खोजें...',
                        all_assets: 'सभी संपत्तियां',
                        buy_property: 'संपत्ति खरीदें',
                        rent_property: 'किराये की संपत्ति',
                        location: 'स्थान',
                        all_cities: 'सभी शहर',
                        type: 'प्रकार',
                        all_types: 'सभी प्रकार',
                        price: 'कीमत',
                        min_price: 'न्यूनतम',
                        max_price: 'अधिकतम',
                        beds: 'बेड',
                        any_beds: 'कोई भी',
                        sort: 'क्रमबद्ध करें',
                        newest_first: 'नवीनतम पहले',
                        price_low_to_high: 'कीमत: कम से अधिक',
                        price_high_to_low: 'कीमत: अधिक से कम',
                        showing: 'दिखा रहे हैं',
                        luxury_properties: 'लक्जरी संपत्तियां',
                        load_more: 'अधिक संपत्तियां लोड करें'
                    },
                    chatbot: {
                        welcome: 'नमस्ते! एस्टेटहब में आपका स्वागत है। आज मैं आपकी प्रीमियम संपत्ति खोज में आपकी कैसे मदद कर सकता हूँ?',
                        placeholder: 'आज हम आपकी कैसे मदद कर सकते हैं?',
                        status: 'ऑनलाइन कंसीयज',
                        responses: {
                            prices: 'एस्टेटहब पर संपत्ति की कीमतें $500k के प्रीमियम अपार्टमेंट से लेकर $10M से अधिक के विशिष्ट विला तक हैं। क्या आप हमारी सबसे महंगी लिस्टिंग देखना चाहेंगे?',
                            contact: 'एडमिन से संपर्क करने के लिए, कृपया संपत्ति विवरण पृष्ठ पर जाएं और दाएं साइडबार पर "Request Exclusive View" फॉर्म का उपयोग करें। हमारे एडमिन 12 घंटे के भीतर जवाब देते हैं।',
                            location: 'हमारे पास बैंगलोर, लंदन, दुबई और मुंबई सहित प्रमुख शहरों में लिस्टिंग है। शहर के अनुसार फ़िल्टर करने के लिए मार्केटप्लेस में सर्च बार का उपयोग करें।',
                            hello: 'नमस्ते! मैं आपका एस्टेटहब एआई असिस्टेंट हूँ। मैं आपको संपत्तियां खोजने, हमारी सेवाओं को समझाने, या एडमिन से संपर्क करने में मार्गदर्शन करने में मदद कर सकता हूँ।',
                            fallback: 'यह एक दिलचस्प सवाल है! मैं अभी भी सीख रहा हूँ, लेकिन मैं निश्चित रूप से हमारे लक्जरी पोर्टफोलियो को नेвиगेट करने में आपकी मदद कर सकता हूँ। क्या आप हमारी नवीनतम संपत्तियां देखना चाहेंगे?'
                        }
                    }
                }
            },
            mr: {
                translation: {
                    nav: {
                        home: 'होम',
                        buy: 'खरेदी करा',
                        rent: 'भाड्याने',
                        favorites: 'आवडते',
                        sell: 'मालमत्ता नोंदवा',
                        my_properties: 'माझे डॅशबोर्ड',
                        dashboard: 'डॅशबोर्ड',
                        sign_out: 'साइन आउट',
                        sign_in: 'साइन इन',
                        register: 'नोंदणी',
                        language: 'भाषा'
                    },
                    home: {
                        hero_title: 'तुमचे खासगी घर शोधा.',
                        hero_subtitle: 'वास्तूशिल्प कला आणि गोपनीयता जपणाऱ्यांसाठी जगातील सर्वोत्तम मालमत्तांचे संकलन.',
                        stats: {
                            market_volume: 'बाजार खंड',
                            private_clients: 'खासगी ग्राहक',
                            avg_appreciation: 'सरासरी कौतुक'
                        },
                        experience: {
                            lifestyle: 'जीवनशैली',
                            redefining: 'आधुनिक वारसा पुन्हा परिभाषित करणे.',
                            subtitle: 'केवळ मालमत्ता शोधण्यापेक्षा काहीतरी अधिक. इस्टेटहब हे एक परिष्कृत जीवनशैलीचे पोर्टल आहे जिथे वास्तुकला आत्म्याला भेटते.',
                            features: {
                                ai_matching: 'एआय-आधारित मॅचिंग',
                                ai_desc: 'तुमच्या जीवनशैलीची डीएनए परिपूर्ण वास्तुकलेशी जुळवण्यासाठी जागतिक अल्गोरिदम.',
                                verification: 'संस्थात्मक पडताळणी',
                                verification_desc: 'पूर्ण कायदेशीर पारदर्शकतेसाठी सुरक्षित ब्लॉकचेन-प्रेरित पडताळणी.',
                                concierge: 'थेट द्वारपाल',
                                concierge_desc: 'मध्यस्थांना टाळा. जागतिक दर्जाच्या इस्टेट प्रशासकांशी थेट कूटबद्ध दुवे.'
                            }
                        },
                        testimonials: {
                            title: 'विशिष्टतेचा आवाज',
                            items: [
                                { role: 'वास्तुकला संचालक', text: "इस्टेटहबने आम्ही आमचे प्रकल्प ज्या प्रकारे सादर करतो त्यात आमूलाग्र बदल केला आहे. गुणवत्ता आणि उच्च-हेतू पूर्णता अतुलनीय आहेत." },
                                { role: 'लक्झरी पोर्टफोलिओ क्लायंट', text: "मला ४८ तासांच्या आत गोव्यात माझे समुद्रकिनाऱ्यावरील अभयारण्य मिळाले. पडताळणी प्रक्रियेने मला पूर्ण मनःशांती दिली." },
                                { role: 'रिअल इस्टेट डेव्हलपर', text: "मी वापरलेले आतापर्यंतचे सर्वात व्यावसायिक व्यासपीठ. इंटरफेस जबरदस्त आहे आणि वापरकर्ता अनुभव उच्च-मूल्य व्यवहारांसाठी डिझाइन केला आहे." }
                            ]
                        }
                    },
                    properties: {
                        title: 'तुमचे परिपूर्ण घर शोधा',
                        subtitle: 'देशभरातील प्रीमियम मालमत्तांच्या आमच्या विशेष संग्रहाचा आनंद घ्या.',
                        search_placeholder: 'मालमत्ता शोधा...',
                        all_assets: 'सर्व मालमत्ता',
                        buy_property: 'खरेदी करा',
                        rent_property: 'भाड्याने घ्या',
                        location: 'स्थान',
                        all_cities: 'सर्व शहरे',
                        type: 'प्रकार',
                        all_types: 'सर्व प्रकार',
                        price: 'किंमत',
                        min_price: 'किमान',
                        max_price: 'कमाल',
                        beds: 'बेड्स',
                        any_beds: 'कोणतेही',
                        sort: 'क्रमवारी',
                        newest_first: 'नवीनतम आधी',
                        price_low_to_high: 'किंमत: कमी ते जास्त',
                        price_high_to_low: 'किंमत: जास्त ते कमी',
                        showing: 'दर्शवित आहे',
                        luxury_properties: 'लक्झरी मालमत्ता',
                        load_more: 'आणखी मालमत्ता पहा'
                    },
                    chatbot: {
                        welcome: 'नमस्कार! इस्टेटहबमध्ये आपले स्वागत आहे. आज मी आपल्या प्रीमियम मालमत्ता शोधामध्ये कशी मदत करू शकतो?',
                        placeholder: 'आज आम्ही कशी मदत करू शकतो?',
                        status: 'ऑनलाइन द्वारपाल',
                        responses: {
                            prices: 'इस्टेटहबवरील मालमत्तेच्या किमती $500k च्या प्रीमियम अपार्टमेंटपासून $10M पेक्षा जास्त असलेल्या विशेष व्हिलापर्यंत आहेत. आपण आमच्या सर्वात महागड्या लिंस्टिग्ज पाहू इच्छिता का?',
                            contact: 'अॅडमिनशी संपर्क साधण्यासाठी, कृपया मालमत्ता तपशील पृष्ठावर जा आणि उजव्या साइडबारवरील "Request Exclusive View" फॉर्म वापरा. आमचे अॅडमिन 12 तासांच्या आत प्रतिसाद देतात.',
                            location: 'आमच्याकडे बंगळुरू, लंडन, दुबई आणि मुंबईसह प्रमुख शहरांमध्ये सूची आहेत. शहराद्वारे फिल्टर करण्यासाठी मार्केटप्लेसमध्ये शोध बार वापरा.',
                            hello: 'नमस्कार! मी आपला इस्टेटहब एआय असिस्टंट आहे. मी तुम्हाला मालमत्ता शोधण्यात, आमच्या सेवा समजावून सांगण्यात किंवा अॅडमिनशी संपर्क साधण्यासाठी मार्गदर्शन करण्यात मदत करू शकतो.',
                            fallback: 'हा एक मनोरंजक प्रश्न आहे! मी अजूनही शिकत आहे, पण मी तुम्हाला आमच्या लक्झरी पोर्टफोलिओमध्ये नेव्हिगेट करण्यात नक्कीच मदत करू शकतो. आपण आमच्या नवीनतम मालमत्ता पाहू इच्छिता का?'
                        }
                    }
                }
            },
            ta: {
                translation: {
                    nav: {
                        home: 'முகப்பு',
                        buy: 'வாங்க',
                        rent: 'வாடகை',
                        favorites: 'விருப்பமானவை',
                        sell: 'சொத்தை பதிவு செய்க',
                        my_properties: 'எனது கணக்கு',
                        dashboard: 'டாஷ்போர்டு',
                        sign_out: 'வெளியேறு',
                        sign_in: 'உள்நுழைக',
                        register: 'பதிவு செய்க',
                        language: 'மொழி'
                    },
                    home: {
                        hero_title: 'உங்கள் தனிப்பட்ட சொர்க்கத்தைக் கண்டறியவும்.',
                        hero_subtitle: 'கட்டிடக்கலை மற்றும் தனியுரிமையை மதிப்பவர்களுக்காக உலகின் மிகச்சிறந்த சொத்துக்களின் தொகுப்பு.',
                        stats: {
                            market_volume: 'சந்தை அளவு',
                            private_clients: 'தனியார் வாடிக்கையாளர்கள்',
                            avg_appreciation: 'சராசரி மதிப்பீடு'
                        },
                        experience: {
                            lifestyle: 'வாழ்க்கை முறை',
                            redefining: 'நவீன மரபை மறுவரையறை செய்தல்.',
                            subtitle: 'வெறும் சொத்துத் தேடல் மட்டுமல்ல. எஸ்டேட்ஹப் என்பது கட்டிடக்கலை ஆன்மாவைச் சந்திக்கும் சுத்திகரிக்கப்பட்ட வாழ்க்கை முறைக்கான நுழைவாயில்.',
                            features: {
                                ai_matching: 'AI மூலம் பொருத்துதல்',
                                ai_desc: 'உங்கள் வாழ்க்கை முறையை சரியான கட்டிடக்கலையோடு பொருத்துவதற்கான உலகளாவிய அல்காரிதம்கள்.',
                                verification: 'நிறுவன சரிபார்ப்பு',
                                verification_desc: 'முழுமையான சட்ட வெளிப்படைத்தன்மைக்கான பாதுகாப்பான பிளாக்செயின் சரிபார்ப்பு.',
                                concierge: 'நேரடி வரவேற்பு',
                                concierge_desc: 'இடைத்தரகர்களைத் தவிர்க்கவும். உலகத்தரம் வாய்ந்த எஸ்டேட் நிர்வாகிகளுக்கு நேரடி மறைகுறியாக்கப்பட்ட இணைப்புகள்.'
                            }
                        },
                        testimonials: {
                            title: 'தனித்துவமான குரல்கள்'
                        }
                    },
                    properties: {
                        title: 'உங்கள் சரியான வீட்டைக் கண்டறியவும்',
                        subtitle: 'நாடு முழுவதிலும் உள்ள பிரీமியம் சொத்துகளின் பிரத்யேக சேகரிப்பை உலாவவும்.',
                        search_placeholder: 'சொத்துகளைத் தேடுக...',
                        all_assets: 'அனைத்துச் சொத்துகள்',
                        buy_property: 'வாங்க',
                        rent_property: 'வாடகைக்கு',
                        location: 'இடம்',
                        all_cities: 'அனைத்து நகரங்களும்',
                        type: 'வகை',
                        all_types: 'அனைத்து வகைகளும்',
                        price: 'விலை',
                        min_price: 'குறைந்தபட்சம்',
                        max_price: 'அதிகபட்சம்',
                        beds: 'படுக்கையறைகள்',
                        any_beds: 'எதுவும்',
                        sort: 'வரிசைப்படுத்து',
                        newest_first: 'புதியது முதலில்',
                        price_low_to_high: 'விலை: குறைந்ததிலிருந்து அதிகத்திற்கு',
                        price_high_to_low: 'விலை: அதிகதிலிருந்து குறைவிற்கு',
                        showing: 'காண்பிக்கப்படுகிறது',
                        luxury_properties: 'ஆடம்பர சொத்துக்கள்',
                        load_more: 'மேலும் சொத்துகளை ஏற்றவும்'
                    },
                    chatbot: {
                        welcome: 'வணக்கம்! எஸ்டேட்ஹப்பிற்கு வரவேற்கிறோம். இன்று உங்கள் பிரீமியம் சொத்து தேடலில் நான் உங்களுக்கு எப்படி உதவ முடியும்?',
                        placeholder: 'இன்று நாம் எப்படி உதவ முடியும்?',
                        status: 'ஆன்லைன் வரவேற்பாளர்',
                        responses: {
                            prices: 'எஸ்டேட்ஹப்பில் சொத்து விலைகள் $500k பிரீமியம் अपार्टमेंटகள் முதல் $10M க்கும் அதிகமான பிரத்யேக வில்லாக்கள் வரை உள்ளன. எங்களின் மிகவும் விலையுயர்ந்த பட்டியல்களைப் பார்க்க விரும்புகிறீர்களா?',
                            contact: 'நிர்வாகியைத் தொடர்பு கொள்ள, சொத்து விவரப் பக்கத்திற்குச் சென்று, வலதுபுறப் பத்தியில் உள்ள "Request Exclusive View" படிவத்தைப் பயன்படுத்தவும். எங்கள் நிர்வாகிகள் 12 மணி நேரத்திற்குள் பதிலளிப்பார்கள்.',
                            location: 'பெங்களூர், லண்டன், துபாய் மற்றும் மும்பை உள்ளிட்ட முக்கிய நகரங்களில் எங்களிடம் பட்டியல்கள் உள்ளன. நகரம் வாரியாக வடிகட்ட சந்தையில் உள்ள தேடல் பட்டியைப் பயன்படுத்தவும்.',
                            hello: 'வணக்கம்! நான் உங்கள் எஸ்டேட்ஹப் AI உதவியாளர். சொத்துக்களைக் கண்டறியவும், எங்களது சேவைகளை விளக்கவும அல்லது நிர்வாகிகளைத் தொடர்பு கொள்ள உங்களுக்கு வழிகாட்டவும் நான் உதவ முடியும்.',
                            fallback: 'அது ஒரு சுவாரஸ்யமான கேள்வி! நான் இன்னும் கற்றுக்கொண்டிருக்கிறேன், ஆனால் எங்களது ஆடம்பரமான சொத்துத் தொகுப்புகளை உலாவ நான் உங்களுக்கு நிச்சயமாக உதவ முடியும். எங்களது சமீபத்திய சொத்துக்களைப் பார்க்க விரும்புகிறீர்களா?'
                        }
                    }
                }
            },
            te: {
                translation: {
                    nav: {
                        home: 'హోమ్',
                        buy: 'కొనుగోలు',
                        rent: 'అద్దె',
                        favorites: 'ఇష్టమైనవి',
                        sell: 'ఆస్తిని జాబితా చేయండి',
                        my_properties: 'నా డ్యాష్‌బోర్డ్',
                        dashboard: 'డాష్‌బోర్డ్',
                        sign_out: 'సైన్ అవుట్',
                        sign_in: 'సైన్ ఇన్',
                        register: 'నమోదు',
                        language: 'భాష'
                    },
                    home: {
                        hero_title: 'మీ వ్యక్తిగత స్వర్గాన్ని కనుగొనండి.',
                        hero_subtitle: 'అత్యుత్తమ వాస్తుశిల్పం మరియు గోప్యతను కోరుకునే వారి కోసం ప్రపంచంలోని అసాధారణమైన ఆస్తుల సేకరణ.',
                        stats: {
                            market_volume: 'మార్కెట్ మొత్తం',
                            private_clients: 'ప్రైవేట్ క్లయింట్లు',
                            avg_appreciation: 'సగటు విలువ పెంపుదల'
                        },
                        experience: {
                            lifestyle: 'జీవనశైలి',
                            redefining: 'ఆధునిక వారసత్వాన్ని పునర్నిర్వచించడం.',
                            subtitle: 'కేవలం ఆస్తి అన్వేషణ మాత్రమే కాదు. ఎస్టేట్‌హబ్ అనేది వాస్తుశిల్పం ఆత్మను కలిసే ఒక శుద్ధి చేసిన జీవనశైలి పోర్టల్.',
                            features: {
                                ai_matching: 'AI-ఆధారిత మ్యాచింగ్',
                                ai_desc: 'మీ జీవనశైలి DNAను ఖచ్చితమైన వాస్తుశిల్పాలతో సరిపోల్చడానికి గ్లోబల్ అల్గారిథమ్స్.',
                                verification: 'సంస్థాగత ధృవీకరణ',
                                verification_desc: 'సంపూర్ణ చట్టపరమైన పారదర్శకత కోసం సురక్షితమైన బ్లాక్‌చైన్ ధృవీకరణ.',
                                concierge: 'నేరుగా సహాయం',
                                concierge_desc: 'మధ్యవర్తులను దాటవేయండి. ప్రపంచ స్థాయి ఎస్టేట్ నిర్వాహకులకు నేరుగా ఎన్‌క్రిప్టెడ్ లింక్‌లు.'
                            }
                        },
                        testimonials: {
                            title: 'విశిష్టమైన వాణి'
                        }
                    },
                    properties: {
                        title: 'మీ పరిపూర్ణ ఇల్లు కనుగొనండి',
                        subtitle: 'దేశవ్యాప్తంగా ఉన్న ప్రీమియం ఆస్తుల ప్రత్యేక సేకరణను బ్రౌజ్ చేయండి.',
                        search_placeholder: 'ఆస్తుల కోసం వెతకండి...',
                        all_assets: 'అన్ని ఆస్తులు',
                        buy_property: 'కొనుగోలు',
                        rent_property: 'అద్దెకు',
                        location: 'ప్రాంతం',
                        all_cities: 'అన్ని నగరాలు',
                        type: 'రకం',
                        all_types: 'అన్ని రకాలు',
                        price: 'ధర',
                        min_price: 'కనిష్టం',
                        max_price: 'గరిష్టం',
                        beds: 'బెడ్స్',
                        any_beds: 'ఏదైనా',
                        sort: 'క్రమబద్ధీకరించు',
                        newest_first: 'కొత్తవి మొదట',
                        price_low_to_high: 'ధర: తక్కువ నుండి ఎక్కువ',
                        price_high_to_low: 'ధర: ఎక్కువ నుండి తక్కువ',
                        showing: 'చూపిస్తున్నాం',
                        luxury_properties: 'విలాసవంతమైన ఆస్తులు',
                        load_more: 'మరిన్ని ఆస్తులను లోడ్ చేయండి'
                    },
                    chatbot: {
                        welcome: 'నమస్కారం! ఎస్టేట్‌హబ్‌కు స్వాగతం. ఈరోజు మీ ప్రీమియం ఆస్తి అన్వేషణలో నేను మీకు ఎలా సహాయం చేయగలను?',
                        placeholder: 'ఈరోజు మేము ఎలా సహాయం చేయగలము?',
                        status: 'ఆన్‌లైన్ సహాయకుడు',
                        responses: {
                            prices: 'ఎస్టేట్‌హబ్‌లో ఆస్తి ధరలు $500k ప్రీమియం అపార్ట్‌మెంట్ల నుండి $10M మించిన ప్రత్యేక విల్లాల వరకు ఉన్నాయి. మీరు మా అత్యంత ఖరీదైన జాబితాలను చూడాలనుకుంటున్నారా?',
                            contact: 'అడ్మిన్‌ను సంప్రదించడానికి, దయచేసి ఆస్తి వివరాల పేజీకి వెళ్లి, కుడి వైపున ఉన్న "Request Exclusive View" ఫారమ్‌ను ఉపయోగించండి. మా అడ్మిన్‌లు 12 గంటలలోపు స్పందిస్తాయి.',
                            location: 'మాకు బెంగళూరు, లండన్, దుబాయ్ మరియు ముంబైతో సహా ప్రధాన నగరాల్లో జాబితాలు ఉన్నాయి. నగరం ద్వారా ఫిల్టర్ చేయడానికి మార్కెట్‌ప్లేస్‌లో సెర్చ్ బార్‌ను ఉపయోగించండి.',
                            hello: 'నమస్కారం! నేను మీ ఎస్టేట్‌హబ్ AI అసిస్టెంట్‌ని. ఆస్తులను కనుగొనడంలో, మా సేవలను వివరించడంలో లేదా అడ్మిన్‌లను సంప్రదించడానికి మీకు మార్గనిర్దేశం చేయడంలో నేను సహాయపడగలను.',
                            fallback: 'అది ఒక ఆసక్తికరమైన ప్రశ్న! నేను ఇంకా నేర్చుకుంటున్నాను, కానీ మా లగ్జరీ పోర్ట్‌ఫోలియోను నావిగేట్ చేయడంలో నేను మీకు ఖచ్చితంగా సహాయపడగలను. మీరు మా లేటెస్ట్ ఆస్తులను బ్రౌజ్ చేయాలనుకుంటున్నారా?'
                        }
                    }
                }
            }
        }
    });

export default i18n;
