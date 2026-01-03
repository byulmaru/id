<script lang="ts">
	import { EllipsisIcon, PlusIcon, TrashIcon } from '@lucide/svelte';
	import { startRegistration as startWebAuthnRegistration } from '@simplewebauthn/browser';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
	import { deletePasskey,generatePasskeyRegistrationOptions, verifyAndSavePasskey } from '$lib/passkey/registration.remote';

	const { data } = $props();

	let isRegistering = $state(false);

	const handleAddPasskey = async () => {
		if (isRegistering) {
			return;
		}

		isRegistering = true;

		try {
			// startRegistration remote function 호출
			const optionsJSON = await generatePasskeyRegistrationOptions();

			// WebAuthn API 호출
			const response = await startWebAuthnRegistration({ optionsJSON });

			// completeRegistration remote function 호출
			await verifyAndSavePasskey({ response });

			// 페이지를 다시 로드하여 업데이트된 패스키 목록 표시
			window.location.reload();
		} catch (error) {
			console.error('Passkey registration failed:', error);
			alert(error instanceof Error ? error.message : '패스키 등록에 실패했습니다');
		} finally {
			isRegistering = false;
		}
	};
</script>

<div class="flex flex-col gap-6">
	<Table>
		<TableHeader>
			<TableRow>
				<TableHead>패스키 목록</TableHead>
			</TableRow>
		</TableHeader>
		<TableBody>
			{#if data.passkeys.length === 0}
				<TableRow>
					<TableCell class="text-muted-foreground">
						<div class="flex items-center gap-2">
							<span>등록된 패스키가 없습니다</span>
						</div>
					</TableCell>
				</TableRow>
			{:else}
				{#each data.passkeys as passkey (passkey.id)}
					<TableRow>
						<TableCell class="flex flex-row justify-between">
							<div class="flex items-center gap-2">
								<span class="font-medium">{passkey.name}</span>
							</div>
							<div>
								<DropdownMenu.Root>
									<DropdownMenu.Trigger>
										<Button class="rounded-full" size="icon" variant="ghost">
											<EllipsisIcon />
										</Button>
									</DropdownMenu.Trigger>
									<DropdownMenu.Content align="end">
										<DropdownMenu.Group>
											<DropdownMenu.Item variant="destructive">
												<button
													class="w-full text-left flex flex-row items-center gap-2"
													onclick={async () => {
														try {
															await deletePasskey({ id: passkey.id });
															window.location.reload();
														} catch (error) {
															console.error('Failed to delete passkey:', error);
															alert('패스키 삭제에 실패했습니다');
														}
													}}
													type="button"
												>
													<TrashIcon />
													<span>삭제</span>
												</button>
											</DropdownMenu.Item>
										</DropdownMenu.Group>
									</DropdownMenu.Content>
								</DropdownMenu.Root>
							</div>
						</TableCell>
					</TableRow>
				{/each}
			{/if}
		</TableBody>
	</Table>

	<Button aria-busy={isRegistering} disabled={isRegistering} onclick={handleAddPasskey}>
		<PlusIcon />
		<span>패스키 추가</span>
	</Button>
</div>
