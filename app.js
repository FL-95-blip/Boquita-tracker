// Main App Component for PWA
const { useState, useEffect } = React;

function FitnessTrackerPWA() {
  const [workoutLog, setWorkoutLog] = useState([]);
  const [nutritionLog, setNutritionLog] = useState([]);
  const [weightLog, setWeightLog] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [activeTab, setActiveTab] = useState('workout');
  const [showSetup, setShowSetup] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('anthropic_api_key') || '');

  // Forms
  const [workoutForm, setWorkoutForm] = useState({
    date: new Date().toISOString().split('T')[0],
    exercise: '',
    sets: '',
    reps: '',
    weight: ''
  });

  const [calorieForm, setCalorieForm] = useState({
    date: new Date().toISOString().split('T')[0],
    calories: '',
    notes: ''
  });

  const [weightForm, setWeightForm] = useState({
    date: new Date().toISOString().split('T')[0],
    weight: ''
  });

  const [activityForm, setActivityForm] = useState({
    date: new Date().toISOString().split('T')[0],
    steps: '',
    caloriesBurnt: '',
    activeTime: ''
  });

  // Load data from localStorage on mount
  useEffect(() => {
    const saved = {
      workoutLog: JSON.parse(localStorage.getItem('workoutLog') || '[]'),
      nutritionLog: JSON.parse(localStorage.getItem('nutritionLog') || '[]'),
      weightLog: JSON.parse(localStorage.getItem('weightLog') || '[]'),
      activityLog: JSON.parse(localStorage.getItem('activityLog') || '[]'),
      photos: JSON.parse(localStorage.getItem('photos') || '[]')
    };
    setWorkoutLog(saved.workoutLog);
    setNutritionLog(saved.nutritionLog);
    setWeightLog(saved.weightLog);
    setActivityLog(saved.activityLog);
    setPhotos(saved.photos);
  }, []);

  // Save data to localStorage whenever logs change
  useEffect(() => {
    localStorage.setItem('workoutLog', JSON.stringify(workoutLog));
  }, [workoutLog]);

  useEffect(() => {
    localStorage.setItem('nutritionLog', JSON.stringify(nutritionLog));
  }, [nutritionLog]);

  useEffect(() => {
    localStorage.setItem('weightLog', JSON.stringify(weightLog));
  }, [weightLog]);

  useEffect(() => {
    localStorage.setItem('activityLog', JSON.stringify(activityLog));
  }, [activityLog]);

  useEffect(() => {
    localStorage.setItem('photos', JSON.stringify(photos));
  }, [photos]);

  // API Key Management
  const handleApiKeySave = () => {
    localStorage.setItem('anthropic_api_key', apiKey);
    alert('API key saved! You can now analyze food photos.');
  };

  // Food Photo Analysis
  const analyzeFoodPhoto = async (imageFile) => {
    if (!apiKey) {
      alert('Please set up your Anthropic API key first in Settings');
      setActiveTab('nutrition');
      return;
    }

    setAnalyzing(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Image = e.target.result.split(',')[1];
        
        try {
          const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
              model: 'claude-opus-4-1-20250805',
              max_tokens: 1024,
              messages: [
                {
                  role: 'user',
                  content: [
                    {
                      type: 'image',
                      source: {
                        type: 'base64',
                        media_type: 'image/jpeg',
                        data: base64Image
                      }
                    },
                    {
                      type: 'text',
                      text: `Analyze this food image and provide:
1. List of identified ingredients with estimated amounts
2. Estimated total calories
3. Macronutrient breakdown (protein, carbs, fats)
4. Confidence level in the estimate

Format your response as JSON with keys: ingredients, total_calories, protein_g, carbs_g, fats_g, confidence`
                    }
                  ]
                }
              ]
            })
          });

          if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
          }

          const data = await response.json();
          const content = data.content[0].text;
          
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            
            setNutritionLog([...nutritionLog, {
              id: Date.now(),
              date: new Date().toISOString().split('T')[0],
              calories: Math.round(parsed.total_calories || 0),
              protein: Math.round(parsed.protein_g || 0),
              carbs: Math.round(parsed.carbs_g || 0),
              fats: Math.round(parsed.fats_g || 0),
              notes: `${parsed.ingredients ? parsed.ingredients.join(', ') : 'Food photo'} (${parsed.confidence || 'medium confidence'})`
            }]);
            
            alert(`✓ Logged ${parsed.total_calories || 0} calories!\n\nBreakdown:\nProtein: ${parsed.protein_g || 0}g\nCarbs: ${parsed.carbs_g || 0}g\nFats: ${parsed.fats_g || 0}g`);
          }
        } catch (err) {
          console.error('Analysis error:', err);
          alert('Error analyzing photo. Make sure your API key is valid.');
        } finally {
          setAnalyzing(false);
        }
      };
      reader.readAsDataURL(imageFile);
    } catch (err) {
      console.error('File read error:', err);
      setAnalyzing(false);
    }
  };

  // Add functions
  const addWorkout = () => {
    if (workoutForm.exercise && workoutForm.sets && workoutForm.reps) {
      setWorkoutLog([...workoutLog, { ...workoutForm, id: Date.now() }]);
      setWorkoutForm({
        date: new Date().toISOString().split('T')[0],
        exercise: '',
        sets: '',
        reps: '',
        weight: ''
      });
    }
  };

  const addCalories = () => {
    if (calorieForm.calories) {
      setNutritionLog([...nutritionLog, { ...calorieForm, id: Date.now(), protein: 0, carbs: 0, fats: 0 }]);
      setCalorieForm({
        date: new Date().toISOString().split('T')[0],
        calories: '',
        notes: ''
      });
    }
  };

  const addWeight = () => {
    if (weightForm.weight) {
      setWeightLog([...weightLog, { ...weightForm, id: Date.now() }]);
      setWeightForm({
        date: new Date().toISOString().split('T')[0],
        weight: ''
      });
    }
  };

  const addActivity = () => {
    if (activityForm.steps || activityForm.caloriesBurnt || activityForm.activeTime) {
      setActivityLog([...activityLog, { ...activityForm, id: Date.now() }]);
      setActivityForm({
        date: new Date().toISOString().split('T')[0],
        steps: '',
        caloriesBurnt: '',
        activeTime: ''
      });
    }
  };

  // Delete functions
  const deleteWorkout = (id) => setWorkoutLog(workoutLog.filter(w => w.id !== id));
  const deleteCalorie = (id) => setNutritionLog(nutritionLog.filter(c => c.id !== id));
  const deleteWeight = (id) => setWeightLog(weightLog.filter(w => w.id !== id));
  const deleteActivity = (id) => setActivityLog(activityLog.filter(a => a.id !== id));
  const deletePhoto = (id) => setPhotos(photos.filter(p => p.id !== id));

  // Photo upload
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotos([...photos, {
          id: Date.now(),
          src: event.target.result,
          date: new Date().toISOString().split('T')[0]
        }]);
      };
      reader.readAsDataURL(file);
    }
  };

  // Calculate daily totals
  const totalCaloriestoday = nutritionLog
    .filter(log => log.date === new Date().toISOString().split('T')[0])
    .reduce((sum, log) => sum + parseInt(log.calories), 0);

  const todayActivity = activityLog.filter(a => a.date === new Date().toISOString().split('T')[0]);
  const todaySteps = todayActivity.reduce((sum, a) => sum + (parseInt(a.steps) || 0), 0);
  const todayCalsBurnt = todayActivity.reduce((sum, a) => sum + (parseInt(a.caloriesBurnt) || 0), 0);
  const todayActiveTime = todayActivity.reduce((sum, a) => sum + (parseInt(a.activeTime) || 0), 0);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #0f172a, #1e293b, #0f172a)',
      fontFamily: "'Poppins', sans-serif",
      color: '#e2e8f0',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Poppins:wght@500;600;700&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        .gradient-text {
          background: linear-gradient(135deg, #FFD700 0%, #FFC72C 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        input, textarea {
          background-color: rgba(0, 48, 135, 0.15);
          border: 2px solid rgba(255, 215, 0, 0.4);
          color: #e2e8f0;
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 16px;
          font-family: inherit;
        }
        
        input:focus, textarea:focus {
          outline: none;
          border-color: #FFD700;
          box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
          background-color: rgba(0, 48, 135, 0.25);
        }
        
        button {
          cursor: pointer;
          font-family: inherit;
          border: none;
          border-radius: 8px;
          transition: all 0.3s ease;
        }
        
        .primary-btn {
          background: linear-gradient(135deg, #FFD700 0%, #FFC72C 100%);
          color: #003087;
          padding: 12px 24px;
          font-weight: bold;
          width: 100%;
        }
        
        .primary-btn:active {
          transform: scale(0.98);
        }
        
        .card {
          background: linear-gradient(135deg, rgba(0, 48, 135, 0.2) 0%, rgba(0, 30, 80, 0.2) 100%);
          border: 2px solid rgba(255, 215, 0, 0.2);
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 4px 20px rgba(255, 215, 0, 0.1);
        }
        
        .tab-btn {
          padding: 12px 16px;
          background: none;
          color: #94a3b8;
          border: none;
          border-bottom: 2px solid transparent;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.3s ease;
        }
        
        .tab-btn.active {
          color: #FFD700;
          border-bottom-color: #FFD700;
        }
      `}</style>

      {/* Header */}
      <div style={{ padding: '16px', borderBottom: '2px solid rgba(255, 215, 0, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, rgba(0, 48, 135, 0.1), rgba(0, 30, 80, 0.1))' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', fontFamily: "'Space Mono', monospace", marginBottom: '4px' }}>
            <span className="gradient-text">GAIN</span> & <span className="gradient-text">LOSE</span>
          </h1>
          <p style={{ fontSize: '12px', color: '#FFD700' }}>Track your progress like a champion</p>
        </div>
        <button onClick={() => setShowSetup(!showSetup)} style={{ background: 'rgba(0, 48, 135, 0.4)', padding: '8px 16px', color: '#FFD700', fontSize: '14px', border: '1px solid rgba(255, 215, 0, 0.3)' }}>
          ⚙️ Setup
        </button>
      </div>

      {/* Setup Modal */}
      {showSetup && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={() => setShowSetup(false)}>
          <div className="card" style={{ maxWidth: '90vw', maxHeight: '80vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#FFD700' }}>Setup Guide</h2>
            
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px', color: '#FFD700' }}>⚡ AI Food Photo Analysis</h3>
            <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '12px' }}>Get your free API key from Anthropic:</p>
            <ol style={{ marginLeft: '16px', fontSize: '13px', color: '#cbd5e1', marginBottom: '12px', lineHeight: '1.6' }}>
              <li>Visit console.anthropic.com</li>
              <li>Sign up or log in</li>
              <li>Create an API key</li>
              <li>Paste it below</li>
            </ol>
            <input
              type="password"
              placeholder="Paste your API key..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              style={{ width: '100%', marginBottom: '8px' }}
            />
            <button onClick={handleApiKeySave} className="primary-btn" style={{ marginBottom: '16px' }}>
              Save API Key
            </button>
            {apiKey && <p style={{ color: '#FFD700', fontSize: '12px' }}>✓ API key saved</p>}

            <button onClick={() => setShowSetup(false)} style={{ background: '#334155', color: '#e2e8f0', padding: '12px', width: '100%' }}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid rgba(255, 215, 0, 0.2)', overflowX: 'auto', padding: '0 16px', background: 'rgba(0, 48, 135, 0.05)' }}>
        {[
          { id: 'workout', label: '💪 Workouts' },
          { id: 'activity', label: '⌚ Activity' },
          { id: 'nutrition', label: '🍽️ Nutrition' },
          { id: 'weight', label: '⚖️ Weight' },
          { id: 'photos', label: '📸 Photos' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {/* Workout Tab */}
        {activeTab === 'workout' && (
          <div>
            <div className="card" style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color: '#FFD700' }}>Log Workout</h3>
              <input type="date" value={workoutForm.date} onChange={(e) => setWorkoutForm({...workoutForm, date: e.target.value})} style={{ width: '100%', marginBottom: '8px' }} />
              <input type="text" placeholder="Exercise" value={workoutForm.exercise} onChange={(e) => setWorkoutForm({...workoutForm, exercise: e.target.value})} style={{ width: '100%', marginBottom: '8px' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <input type="number" placeholder="Sets" value={workoutForm.sets} onChange={(e) => setWorkoutForm({...workoutForm, sets: e.target.value})} />
                <input type="number" placeholder="Reps" value={workoutForm.reps} onChange={(e) => setWorkoutForm({...workoutForm, reps: e.target.value})} />
              </div>
              <input type="number" placeholder="Weight" value={workoutForm.weight} onChange={(e) => setWorkoutForm({...workoutForm, weight: e.target.value})} style={{ width: '100%', marginBottom: '8px' }} />
              <button onClick={addWorkout} className="primary-btn">Add Workout</button>
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px', color: '#FFD700' }}>Workout Log</h3>
            {workoutLog.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', color: '#94a3b8' }}>No workouts logged yet</div>
            ) : (
              workoutLog.map(w => (
                <div key={w.id} className="card" style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontWeight: 'bold', color: '#FFD700' }}>{w.exercise}</p>
                    <p style={{ fontSize: '12px', color: '#94a3b8' }}>{w.sets}x{w.reps} {w.weight && `@ ${w.weight}lbs`}</p>
                    <p style={{ fontSize: '10px', color: '#64748b' }}>{w.date}</p>
                  </div>
                  <button onClick={() => deleteWorkout(w.id)} style={{ background: 'none', color: '#ef4444', fontSize: '18px', padding: '0' }}>✕</button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div>
            <div className="card" style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color: '#FFD700' }}>📱 Log Samsung Activity</h3>
              <input type="date" value={activityForm.date} onChange={(e) => setActivityForm({...activityForm, date: e.target.value})} style={{ width: '100%', marginBottom: '8px' }} />
              <input type="number" placeholder="Steps" value={activityForm.steps} onChange={(e) => setActivityForm({...activityForm, steps: e.target.value})} style={{ width: '100%', marginBottom: '8px' }} />
              <input type="number" placeholder="Calories Burnt" value={activityForm.caloriesBurnt} onChange={(e) => setActivityForm({...activityForm, caloriesBurnt: e.target.value})} style={{ width: '100%', marginBottom: '8px' }} />
              <input type="number" placeholder="Active Time (min)" value={activityForm.activeTime} onChange={(e) => setActivityForm({...activityForm, activeTime: e.target.value})} style={{ width: '100%', marginBottom: '8px' }} />
              <button onClick={addActivity} className="primary-btn">Log Activity</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '16px' }}>
              <div className="card" style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '12px', color: '#94a3b8' }}>Steps</p>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#FFD700' }}>{todaySteps.toLocaleString()}</p>
              </div>
              <div className="card" style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '12px', color: '#94a3b8' }}>Cal Burnt</p>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#FFD700' }}>{todayCalsBurnt}</p>
              </div>
              <div className="card" style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '12px', color: '#94a3b8' }}>Active</p>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#e2e8f0' }}>{todayActiveTime}m</p>
              </div>
            </div>

            {activityLog.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', color: '#94a3b8' }}>No activity logged yet</div>
            ) : (
              [...activityLog].reverse().map(a => (
                <div key={a.id} className="card" style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontWeight: 'bold', color: '#FFD700' }}>{parseInt(a.steps).toLocaleString()} steps</p>
                    <p style={{ fontSize: '12px', color: '#94a3b8' }}>{a.caloriesBurnt && `${a.caloriesBurnt} cal • `}{a.activeTime && `${a.activeTime} min`}</p>
                    <p style={{ fontSize: '10px', color: '#64748b' }}>{a.date}</p>
                  </div>
                  <button onClick={() => deleteActivity(a.id)} style={{ background: 'none', color: '#ef4444', fontSize: '18px', padding: '0' }}>✕</button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Nutrition Tab */}
        {activeTab === 'nutrition' && (
          <div>
            <div className="card" style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color: '#FFD700' }}>Log Food</h3>
              <label style={{ display: 'block', marginBottom: '12px' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files[0] && analyzeFoodPhoto(e.target.files[0])}
                  disabled={analyzing}
                  style={{ cursor: 'pointer' }}
                />
                <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>📸 Analyze food photo</p>
              </label>

              <div style={{ borderTop: '1px solid rgba(51, 65, 85, 0.3)', paddingTop: '12px' }}>
                <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>Or log manually:</p>
                <input type="date" value={calorieForm.date} onChange={(e) => setCalorieForm({...calorieForm, date: e.target.value})} style={{ width: '100%', marginBottom: '8px' }} />
                <input type="number" placeholder="Calories" value={calorieForm.calories} onChange={(e) => setCalorieForm({...calorieForm, calories: e.target.value})} style={{ width: '100%', marginBottom: '8px' }} />
                <textarea placeholder="Notes" value={calorieForm.notes} onChange={(e) => setCalorieForm({...calorieForm, notes: e.target.value})} style={{ width: '100%', height: '60px', marginBottom: '8px' }} />
                <button onClick={addCalories} className="primary-btn">Add Entry</button>
              </div>
            </div>

            <div className="card" style={{ marginBottom: '16px', textAlign: 'center' }}>
              <p style={{ fontSize: '12px', color: '#94a3b8' }}>Today's Total</p>
              <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#FFD700' }}>{totalCaloriestoday}</p>
              <p style={{ fontSize: '12px', color: '#64748b' }}>calories</p>
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px', color: '#FFD700' }}>Nutrition Log</h3>
            {nutritionLog.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', color: '#94a3b8' }}>No entries yet</div>
            ) : (
              nutritionLog.map(n => (
                <div key={n.id} className="card" style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontWeight: 'bold', color: '#FFD700' }}>{n.calories} cal</p>
                    {n.notes && <p style={{ fontSize: '12px', color: '#94a3b8' }}>{n.notes}</p>}
                    <p style={{ fontSize: '10px', color: '#64748b' }}>{n.date}</p>
                  </div>
                  <button onClick={() => deleteCalorie(n.id)} style={{ background: 'none', color: '#ef4444', fontSize: '18px', padding: '0' }}>✕</button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Weight Tab */}
        {activeTab === 'weight' && (
          <div>
            <div className="card" style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color: '#FFD700' }}>Log Weight</h3>
              <input type="date" value={weightForm.date} onChange={(e) => setWeightForm({...weightForm, date: e.target.value})} style={{ width: '100%', marginBottom: '8px' }} />
              <input type="number" step="0.1" placeholder="Weight (lbs/kg)" value={weightForm.weight} onChange={(e) => setWeightForm({...weightForm, weight: e.target.value})} style={{ width: '100%', marginBottom: '8px' }} />
              <button onClick={addWeight} className="primary-btn">Record Weight</button>
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px', color: '#FFD700' }}>Weight History</h3>
            {weightLog.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', color: '#94a3b8' }}>No weight entries yet</div>
            ) : (
              weightLog.map(w => (
                <div key={w.id} className="card" style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontWeight: 'bold', color: '#FFD700', fontSize: '18px' }}>{w.weight} lbs/kg</p>
                    <p style={{ fontSize: '10px', color: '#64748b' }}>{w.date}</p>
                  </div>
                  <button onClick={() => deleteWeight(w.id)} style={{ background: 'none', color: '#ef4444', fontSize: '18px', padding: '0' }}>✕</button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Photos Tab */}
        {activeTab === 'photos' && (
          <div>
            <div className="card" style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color: '#FFD700' }}>Upload Progress Photo</h3>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ width: '100%' }} />
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px', color: '#FFD700' }}>Progress Gallery</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {photos.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', color: '#94a3b8', gridColumn: '1 / -1' }}>
                  No photos yet
                </div>
              ) : (
                photos.map(p => (
                  <div key={p.id} style={{ position: 'relative' }}>
                    <img src={p.src} alt="Progress" style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px' }} />
                    <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>{p.date}</p>
                    <button onClick={() => deletePhoto(p.id)} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.7)', color: '#ef4444', padding: '4px 8px', borderRadius: '4px' }}>✕</button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Render the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<FitnessTrackerPWA />);
