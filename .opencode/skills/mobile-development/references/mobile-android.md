# Android Native Development

Complete guide to Android development with Kotlin and Jetpack Compose (2024-2025).

## Kotlin 2.1 Overview

### Key Features
- **Null safety**: No more NullPointerExceptions
- **Coroutines**: Structured concurrency
- **Extension functions**: Extend classes without inheritance
- **Sealed classes**: Type-safe state management
- **Data classes**: Automatic equals/hashCode/toString

### Modern Kotlin Patterns

**Coroutines:**
```kotlin
// Suspend function
suspend fun fetchUser(id: String): User {
    return withContext(Dispatchers.IO) {
        api.getUser(id)
    }
}

// Usage in ViewModel
viewModelScope.launch {
    try {
        val user = fetchUser("123")
        _uiState.update { it.copy(user = user) }
    } catch (e: Exception) {
        _uiState.update { it.copy(error = e.message) }
    }
}
```

**Flow (Reactive streams):**
```kotlin
class UserRepository {
    fun observeUsers(): Flow<List<User>> = flow {
        while (true) {
            emit(database.getUsers())
            delay(5000)  // Poll every 5 seconds
        }
    }.flowOn(Dispatchers.IO)
}

// Collect in ViewModel
init {
    viewModelScope.launch {
        repository.observeUsers().collect { users ->
            _uiState.update { it.copy(users = users) }
        }
    }
}
```

**Sealed classes (Type-safe states):**
```kotlin
sealed class UiState {
    object Loading : UiState()
    data class Success(val data: List<User>) : UiState()
    data class Error(val message: String) : UiState()
}

// Pattern matching
when (uiState) {
    is UiState.Loading -> ShowLoader()
    is UiState.Success -> ShowData(uiState.data)
    is UiState.Error -> ShowError(uiState.message)
}
```

## Jetpack Compose

### Why Compose?
- **Declarative**: Describe UI state, not imperative commands
- **60% adoption**: In top 1,000 apps (2024)
- **Less code**: 40% reduction vs Views
- **Modern**: Built for Kotlin and coroutines
- **Material 3**: First-class support

### Compose Basics

```kotlin
@Composable
fun UserListScreen(viewModel: UserViewModel = viewModel()) {
    val uiState by viewModel.uiState.collectAsState()

    Column(modifier = Modifier.fillMaxSize()) {
        when (val state = uiState) {
            is UiState.Loading -> {
                CircularProgressIndicator(
                    modifier = Modifier.align(Alignment.CenterHorizontally)
                )
            }
            is UiState.Success -> {
                LazyColumn {
                    items(state.data) { user ->
                        UserItem(user)
                    }
                }
            }
            is UiState.Error -> {
                Text(
                    text = state.message,
                    color = MaterialTheme.colorScheme.error
                )
            }
        }
    }
}

@Composable
fun UserItem(user: User) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp)
    ) {
        Text(
            text = user.name,
            style = MaterialTheme.typography.bodyLarge
        )
    }
}
```

**Key Composables:**
- `Column/Row/Box`: Layout
- `LazyColumn/LazyRow`: Recycler equivalent (virtualized)
- `Text/Image/Icon`: Content
- `Button/TextField`: Input
- `Card/Surface`: Containers

## Architecture Patterns

### MVVM with Clean Architecture

```kotlin
// Domain Layer - Use Case
class GetUsersUseCase @Inject constructor(
    private val repository: UserRepository
) {
    operator fun invoke(): Flow<Result<List<User>>> =
        repository.getUsers()
}

// Data Layer - Repository
interface UserRepository {
    fun getUsers(): Flow<Result<List<User>>>
}

class UserRepositoryImpl @Inject constructor(
    private val api: UserApi,
    private val dao: UserDao
) : UserRepository {
    override fun getUsers(): Flow<Result<List<User>>> = flow {
        // Local cache first
        val cachedUsers = dao.getUsers()
        emit(Result.success(cachedUsers))

        // Then fetch from network
        try {
            val networkUsers = api.getUsers()
            dao.insertUsers(networkUsers)
            emit(Result.success(networkUsers))
        } catch (e: Exception) {
            emit(Result.failure(e))
        }
    }.flowOn(Dispatchers.IO)
}

// Presentation Layer - ViewModel
@HiltViewModel
class UserViewModel @Inject constructor(
    private val getUsersUseCase: GetUsersUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(UserUiState())
    val uiState: StateFlow<UserUiState> = _uiState.asStateFlow()

    init {
        loadUsers()
    }

    private fun loadUsers() {
        viewModelScope.launch {
            getUsersUseCase().collect { result ->
                result.onSuccess { users ->
                    _uiState.update { it.copy(users = users, isLoading = false) }
                }.onFailure { error ->
                    _uiState.update { it.copy(error = error.message, isLoading = false) }
                }
            }
        }
    }
}

// UI State
data class UserUiState(
    val users: List<User> = emptyList(),
    val isLoading: Boolean = true,
    val error: String? = null
)
```

### MVI (Model-View-Intent)

**When to use:**
- Unidirectional data flow needed
- Complex state management
- Time-travel debugging
- Predictable state updates

```kotlin
// State
data class UserScreenState(
    val users: List<User> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)

// Events (User intentions)
sealed class UserEvent {
    object LoadUsers : UserEvent()
    data class DeleteUser(val id: String) : UserEvent()
    object RetryLoad : UserEvent()
}

// ViewModel
class UserViewModel : ViewModel() {
    private val _state = MutableStateFlow(UserScreenState())
    val state: StateFlow<UserScreenState> = _state.asStateFlow()

    fun onEvent(event: UserEvent) {
        when (event) {
            is UserEvent.LoadUsers -> loadUsers()
            is UserEvent.DeleteUser -> deleteUser(event.id)
            is UserEvent.RetryLoad -> loadUsers()
        }
    }
}
```

## Dependency Injection

### Hilt (Recommended for Large Apps)

**Setup:**
```kotlin
// App class
@HiltAndroidApp
class MyApplication : Application()

// Activity
@AndroidEntryPoint
class MainActivity : ComponentActivity()

// ViewModel
@HiltViewModel
class UserViewModel @Inject constructor(
    private val repository: UserRepository,
    private val analytics: Analytics
) : ViewModel()

// Module
@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {
    @Provides
    @Singleton
    fun provideRetrofit(): Retrofit = Retrofit.Builder()
        .baseUrl("https://api.example.com")
        .addConverterFactory(GsonConverterFactory.create())
        .build()

    @Provides
    @Singleton
    fun provideUserApi(retrofit: Retrofit): UserApi =
        retrofit.create(UserApi::class.java)
}
```

### Koin (Lightweight Alternative)

**Setup:**
```kotlin
// Module definition
val appModule = module {
    single { UserRepository(get()) }
    viewModel { UserViewModel(get()) }
}

// Application
class MyApp : Application() {
    override fun onCreate() {
        super.onCreate()
        startKoin {
            androidContext(this@MyApp)
            modules(appModule)
        }
    }
}

// Usage
class UserViewModel(
    private val repository: UserRepository
) : ViewModel()
```

**Hilt vs Koin:**
- **Hilt**: Compile-time, type-safe, Google-backed, complex setup
- **Koin**: Runtime, simple DSL, 50% faster setup, reflection-based

## Performance Optimization

### R8 Optimization

**Automatic optimizations:**
- Code shrinking (remove unused)
- Obfuscation (rename classes/methods)
- Optimization (method inlining)

```groovy
// build.gradle
android {
    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt')
        }
    }
}
```

**Impact:**
- 10-20% app size reduction
- 20% faster startup
- Harder to reverse engineer

### Baseline Profiles

**Performance boost:**
- 10-20% faster startup
- Reduced jank in critical paths
- AOT compilation of hot code

```gradle
// build.gradle
dependencies {
    implementation "androidx.profileinstaller:profileinstaller:1.3.1"
}
```

### Compose Performance

**1. Stability annotations:**
```kotlin
// Mark stable classes
@Stable
data class User(val name: String, val age: Int)

// Immutable collections
@Immutable
data class UserList(val users: List<User>)
```

**2. Avoid recomposition:**
```kotlin
// ❌ Bad: Recomposes every render
@Composable
fun UserList(users: List<User>) {
    LazyColumn {
        items(users) { user ->
            Text(user.name)  // Recreated every time
        }
    }
}

// ✅ Good: Use keys
@Composable
fun UserList(users: List<User>) {
    LazyColumn {
        items(users, key = { it.id }) { user ->
            Text(user.name)
        }
    }
}
```

**3. Remember expensive computations:**
```kotlin
@Composable
fun ExpensiveList(items: List<Item>) {
    val sortedItems = remember(items) {
        items.sortedBy { it.priority }
    }

    LazyColumn {
        items(sortedItems) { item ->
            ItemCard(item)
        }
    }
}
```

## Testing

### Unit Testing (JUnit + MockK)

```kotlin
class UserViewModelTest {
    private lateinit var viewModel: UserViewModel
    private val mockRepository = mockk<UserRepository>()

    @Before
    fun setup() {
        viewModel = UserViewModel(mockRepository)
    }

    @Test
    fun `loadUsers should update state with users`() = runTest {
        // Given
        val users = listOf(User("1", "Test", "test@example.com"))
        coEvery { mockRepository.getUsers() } returns flowOf(Result.success(users))

        // When
        viewModel.loadUsers()

        // Then
        val state = viewModel.uiState.value
        assertEquals(users, state.users)
        assertFalse(state.isLoading)
    }
}
```

### Compose Testing

```kotlin
class UserListScreenTest {
    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun displayUsers() {
        val users = listOf(User("1", "John", "john@example.com"))

        composeTestRule.setContent {
            UserListScreen(
                users = users,
                onUserClick = {}
            )
        }

        composeTestRule.onNodeWithText("John").assertIsDisplayed()
    }
}
```

### Instrumented Testing (Espresso)

```kotlin
@RunWith(AndroidJUnit4::class)
class LoginActivityTest {
    @get:Rule
    val activityRule = ActivityScenarioRule(LoginActivity::class.java)

    @Test
    fun loginFlow() {
        onView(withId(R.id.emailField))
            .perform(typeText("test@example.com"))

        onView(withId(R.id.passwordField))
            .perform(typeText("password123"))

        onView(withId(R.id.loginButton))
            .perform(click())

        onView(withText("Welcome"))
            .check(matches(isDisplayed()))
    }
}
```

## Material Design 3

### Theme Setup

```kotlin
@Composable
fun AppTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = true,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context)
            else dynamicLightColorScheme(context)
        }
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
```

### Material Components

```kotlin
// Cards
Card(
    modifier = Modifier.fillMaxWidth(),
    elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
) {
    Text("Content")
}

// FAB
FloatingActionButton(onClick = { /* Do something */ }) {
    Icon(Icons.Default.Add, contentDescription = "Add")
}

// Navigation
NavigationBar {
    items.forEach { item ->
        NavigationBarItem(
            icon = { Icon(item.icon, contentDescription = null) },
            label = { Text(item.label) },
            selected = selectedItem == item,
            onClick = { selectedItem = item }
        )
    }
}
```

## Google Play Requirements (2024-2025)

### SDK Requirements
- **Current**: Target Android 14 (API 34)
- **Mandatory (Aug 31, 2025)**: Target Android 15 (API 35)

### Privacy & Security
- **Privacy policy**: Required for apps collecting data
- **Data safety**: Form in Play Console
- **Permissions**: Request only needed, justify dangerous permissions
- **Encryption**: HTTPS for network, KeyStore for sensitive data

### AAB (Android App Bundle)
```gradle
android {
    bundle {
        density {
            enableSplit true
        }
        abi {
            enableSplit true
        }
        language {
            enableSplit true
        }
    }
}
```

**Benefits:**
- 15-30% smaller downloads
- Dynamic feature modules
- Instant apps support

## Common Pitfalls

1. **Main thread blocking**: Use coroutines with Dispatchers.IO
2. **Memory leaks**: Unregister listeners, cancel coroutines
3. **Configuration changes**: Use ViewModel, avoid Activity references
4. **Large images**: Use Coil/Glide for caching and resizing
5. **Forgetting permissions**: Runtime permission requests
6. **Ignoring Android versions**: Test on multiple API levels
7. **Not handling back press**: OnBackPressedDispatcher
8. **Hardcoded strings**: Use strings.xml for localization
9. **Not using Proguard/R8**: Enable in release builds
10. **Ignoring battery**: Use WorkManager for background tasks

## Resources

**Official:**
- Kotlin Docs: https://kotlinlang.org/docs/home.html
- Compose Docs: https://developer.android.com/jetpack/compose
- Material 3: https://m3.material.io/
- Android Guides: https://developer.android.com/guide

**Community:**
- Android Weekly: https://androidweekly.net/
- Kt.Academy: https://kt.academy/
- Coding in Flow: https://codinginflow.com/
- Philipp Lackner: https://pl-coding.com/
