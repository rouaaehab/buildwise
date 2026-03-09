-- Set role to admin for the user with email admin@gmail.com
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'admin@gmail.com');
