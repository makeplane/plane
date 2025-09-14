// OPTION 1: FOLDER-BASED STRUCTURE (Like Next.js)
// This creates the same routes as Next.js folder structure

app/routes/
├── _index.tsx                    # → /
├── about.tsx                     # → /about
├── blog/
│   ├── route.tsx                 # → /blog (layout)
│   ├── _index.tsx                # → /blog
│   ├── $slug.tsx                 # → /blog/:slug
│   └── categories/
│       ├── route.tsx             # → /blog/categories (layout)
│       ├── _index.tsx            # → /blog/categories
│       └── $categoryId.tsx       # → /blog/categories/:categoryId
├── dashboard/
│   ├── route.tsx                 # → /dashboard (layout)
│   ├── _index.tsx                # → /dashboard
│   ├── settings.tsx              # → /dashboard/settings
│   ├── users/
│   │   ├── route.tsx             # → /dashboard/users (layout)
│   │   ├── _index.tsx            # → /dashboard/users
│   │   ├── $userId.tsx           # → /dashboard/users/:userId
│   │   └── $userId.edit.tsx      # → /dashboard/users/:userId/edit
│   └── analytics.tsx             # → /dashboard/analytics
└── auth/
    ├── login.tsx                 # → /auth/login
    └── register.tsx              # → /auth/register

// OPTION 2: FLAT STRUCTURE (All at root level)
app/routes/
├── _index.tsx                    # → /
├── about.tsx                     # → /about
├── blog.tsx                      # → /blog (layout)
├── blog._index.tsx               # → /blog
├── blog.$slug.tsx                # → /blog/:slug
├── blog.categories.tsx           # → /blog/categories (layout)
├── blog.categories._index.tsx    # → /blog/categories
├── blog.categories.$categoryId.tsx # → /blog/categories/:categoryId
├── dashboard.tsx                 # → /dashboard (layout)
├── dashboard._index.tsx          # → /dashboard
├── dashboard.settings.tsx        # → /dashboard/settings
├── dashboard.users.tsx           # → /dashboard/users (layout)
├── dashboard.users._index.tsx    # → /dashboard/users
├── dashboard.users.$userId.tsx   # → /dashboard/users/:userId
├── dashboard.users.$userId.edit.tsx # → /dashboard/users/:userId/edit
├── dashboard.analytics.tsx       # → /dashboard/analytics
├── auth.login.tsx                # → /auth/login
└── auth.register.tsx             # → /auth/register

// OPTION 3: HYBRID APPROACH (Mix of both)
app/routes/
├── _index.tsx                    # → /
├── about.tsx                     # → /about
├── blog/                         # Folder for complex sections
│   ├── route.tsx                 
│   ├── _index.tsx                
│   ├── $slug.tsx                 
│   └── categories/
│       ├── route.tsx             
│       ├── _index.tsx            
│       └── $categoryId.tsx       
├── dashboard.tsx                 # Simple layout at root
├── dashboard._index.tsx          
├── dashboard.settings.tsx        
├── dashboard.analytics.tsx       
└── auth.login.tsx                # Simple routes at root

// EXAMPLES OF FOLDER-BASED ROUTES

// app/routes/blog/route.tsx - Blog layout
import { Outlet } from "react-router";
import type { LoaderFunction } from "react-router";

export const loader: LoaderFunction = async () => {
  const categories = await getBlogCategories();
  return { categories };
};

export default function BlogLayout() {
  const { categories } = useLoaderData();
  
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Our Blog</h1>
        <nav className="mt-4">
          <ul className="flex space-x-4">
            <li><Link to="/blog">All Posts</Link></li>
            {categories.map(cat => (
              <li key={cat.id}>
                <Link to={`/blog/categories/${cat.id}`}>{cat.name}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      
      <main>
        <Outlet />
      </main>
    </div>
  );
}

// app/routes/blog/_index.tsx - Blog homepage
import type { LoaderFunction } from "react-router";

export const loader: LoaderFunction = async () => {
  const posts = await getBlogPosts();
  return { posts };
};

export default function BlogIndex() {
  const { posts } = useLoaderData();
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Latest Posts</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map(post => (
          <article key={post.id} className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-2">
              <Link to={`/blog/${post.slug}`} className="hover:text-blue-600">
                {post.title}
              </Link>
            </h3>
            <p className="text-gray-600 mb-4">{post.excerpt}</p>
            <p className="text-sm text-gray-500">{post.publishedAt}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

// app/routes/blog/$slug.tsx - Individual blog post
import type { LoaderFunction } from "react-router";

export const loader: LoaderFunction = async ({ params }) => {
  const post = await getBlogPost(params.slug);
  if (!post) {
    throw new Response("Post not found", { status: 404 });
  }
  return { post };
};

export default function BlogPost() {
  const { post } = useLoaderData();
  
  return (
    <article className="max-w-3xl">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
        <div className="flex items-center text-gray-600 mb-4">
          <span>By {post.author}</span>
          <span className="mx-2">•</span>
          <span>{post.publishedAt}</span>
        </div>
        {post.featuredImage && (
          <img 
            src={post.featuredImage} 
            alt={post.title}
            className="w-full h-64 object-cover rounded-lg"
          />
        )}
      </header>
      
      <div 
        className="prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
      
      <footer className="mt-8 pt-8 border-t">
        <div className="flex flex-wrap gap-2">
          {post.tags.map(tag => (
            <span 
              key={tag}
              className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      </footer>
    </article>
  );
}

// app/routes/dashboard/users/route.tsx - Nested users layout
import { Outlet, Link, useLocation } from "react-router";

export default function UsersLayout() {
  const location = useLocation();
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <Link 
          to="/dashboard/users/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add New User
        </Link>
      </div>
      
      {/* Sub-navigation */}
      <nav className="mb-6">
        <ul className="flex space-x-4 border-b">
          <li>
            <Link 
              to="/dashboard/users"
              className={`pb-2 px-1 ${
                location.pathname === '/dashboard/users' 
                  ? 'border-b-2 border-blue-600 text-blue-600' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Users
            </Link>
          </li>
          <li>
            <Link 
              to="/dashboard/users/active"
              className={`pb-2 px-1 ${
                location.pathname === '/dashboard/users/active' 
                  ? 'border-b-2 border-blue-600 text-blue-600' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Active Users
            </Link>
          </li>
        </ul>
      </nav>
      
      <Outlet />
    </div>
  );
}

// app/routes/dashboard/users/$userId.tsx - User detail page
import type { LoaderFunction } from "react-router";

export const loader: LoaderFunction = async ({ params }) => {
  const user = await getUser(params.userId);
  if (!user) {
    throw new Response("User not found", { status: 404 });
  }
  return { user };
};

export default function UserDetail() {
  const { user } = useLoaderData();
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <img 
            src={user.avatar || '/default-avatar.png'} 
            alt={user.name}
            className="w-16 h-16 rounded-full"
          />
          <div>
            <h2 className="text-2xl font-bold">{user.name}</h2>
            <p className="text-gray-600">{user.email}</p>
          </div>
        </div>
        <Link 
          to={`/dashboard/users/${user.id}/edit`}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Edit User
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Profile Information</h3>
          <dl className="space-y-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Full Name</dt>
              <dd className="text-sm text-gray-900">{user.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="text-sm text-gray-900">{user.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Role</dt>
              <dd className="text-sm text-gray-900">{user.role}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="text-sm text-gray-900">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  user.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {user.status}
                </span>
              </dd>
            </div>
          </dl>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-2">Account Details</h3>
          <dl className="space-y-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Member Since</dt>
              <dd className="text-sm text-gray-900">{user.createdAt}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Last Login</dt>
              <dd className="text-sm text-gray-900">{user.lastLoginAt}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Total Orders</dt>
              <dd className="text-sm text-gray-900">{user.orderCount}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}

// COMPARISON WITH NEXT.JS STRUCTURE

/*
Next.js Structure:
pages/
├── index.js                     # /
├── about.js                     # /about
├── blog/
│   ├── index.js                 # /blog
│   ├── [slug].js                # /blog/[slug]
│   └── categories/
│       ├── index.js             # /blog/categories
│       └── [categoryId].js      # /blog/categories/[categoryId]
└── dashboard/
    ├── index.js                 # /dashboard
    ├── settings.js              # /dashboard/settings
    └── users/
        ├── index.js             # /dashboard/users
        ├── [userId].js          # /dashboard/users/[userId]
        └── [userId]/
            └── edit.js          # /dashboard/users/[userId]/edit

React Router 7 Equivalent (Folder-based):
app/routes/
├── _index.tsx                   # /
├── about.tsx                    # /about
├── blog/
│   ├── route.tsx                # /blog (with layout)
│   ├── _index.tsx               # /blog
│   ├── $slug.tsx                # /blog/:slug
│   └── categories/
│       ├── route.tsx            # /blog/categories (with layout)
│       ├── _index.tsx           # /blog/categories
│       └── $categoryId.tsx      # /blog/categories/:categoryId
└── dashboard/
    ├── route.tsx                # /dashboard (with layout)
    ├── _index.tsx               # /dashboard
    ├── settings.tsx             # /dashboard/settings
    └── users/
        ├── route.tsx            # /dashboard/users (with layout)
        ├── _index.tsx           # /dashboard/users
        ├── $userId.tsx          # /dashboard/users/:userId
        └── $userId.edit.tsx     # /dashboard/users/:userId/edit
*/