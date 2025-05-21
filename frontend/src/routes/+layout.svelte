<script lang="ts">
	import '../app.css';
	
	let { children } = $props();
</script>

<div class="flex flex-col min-h-screen">
	<header class="bg-gray-800 text-white py-2">
		<div class="max-w-5xl mx-auto px-2">
			<h1 class="text-2xl font-bold m-0">CYOA</h1>
			<!-- Optional: Add navigation or other header elements here -->
		</div>
	</header>

	<main class="flex-1 max-w-5xl w-full mx-auto px-2 py-2">
		{@render children()}
	</main>

	<footer class="bg-gray-100 py-1 mt-auto">
		<div class="max-w-5xl mx-auto px-6 text-sm text-gray-600">
			<!-- Optional: Add footer content here -->
			<p>©{new Date().getFullYear()} Codepet</p>
		</div>
	</footer>
</div>