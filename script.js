const VALID_EMAIL = 'admin@library.com';
const VALID_PASSWORD = 'admin123';
const BOOKS_KEY = 'lmsBooks';
const MEMBERS_KEY = 'lmsMembers';
const LOANS_KEY = 'lmsLoans';
const PROFILE_KEY = 'lmsProfile';
const THEME_KEY = 'lmsTheme';
const READ_NOTIFICATIONS_KEY = 'lmsReadNotifications';
const DEMO_DATA_KEY = 'lmsDemoDataSeeded';
const LOAN_PERIOD_DAYS = 14;
const FINE_PER_DAY = 1;
const readRecords = (key) => {
  try {
    const records = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(records) ? records : [];
  } catch {
    return [];
  }
};

const createId = () => {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const dateToString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addDays = (dateString, numberOfDays) => {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + numberOfDays);
  return date.toISOString().slice(0, 10);
};

const countLateDays = (dueDate, endDate) => {
  if (!dueDate || !endDate || endDate <= dueDate) return 0;
  return Math.floor((Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${dueDate}T00:00:00Z`)) / 86400000);
};

const formatDate = (dateString) => {
  if (!dateString) return '—';
  return new Date(`${dateString}T00:00:00Z`).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC'
  });
};

const seedDemoDataWhenEmpty = () => {
  const existingBooks = readRecords(BOOKS_KEY);
  const existingMembers = readRecords(MEMBERS_KEY);
  const existingLoans = readRecords(LOANS_KEY);
  if (localStorage.getItem(DEMO_DATA_KEY)) return;

  if (!existingBooks.length && !existingMembers.length && !existingLoans.length) {
    const today = dateToString(new Date());
    const members = [
      { id: 'demo-member-ava', name: 'Ava Martinez', email: 'ava.martinez@example.com', phone: '555-0101', joinedAt: addDays(today, -120) },
      { id: 'demo-member-liam', name: 'Liam Chen', email: 'liam.chen@example.com', phone: '555-0102', joinedAt: addDays(today, -60) },
      { id: 'demo-member-nora', name: 'Nora Williams', email: 'nora.williams@example.com', phone: '555-0103', joinedAt: addDays(today, -30) }
    ];
    const createdAt = Date.now();
    const books = [
      { id: 'demo-book-clean-code', title: 'Clean Code', author: 'Robert C. Martin', isbn: '9780132350884', category: 'Technology', year: 2008, copies: 3, createdAt: new Date(createdAt - 4 * 86400000).toISOString() },
      { id: 'demo-book-atomic-habits', title: 'Atomic Habits', author: 'James Clear', isbn: '9780735211292', category: 'Personal Development', year: 2018, copies: 2, createdAt: new Date(createdAt - 3 * 86400000).toISOString() },
      { id: 'demo-book-hobbit', title: 'The Hobbit', author: 'J. R. R. Tolkien', isbn: '9780547928227', category: 'Fantasy', year: 1937, copies: 2, createdAt: new Date(createdAt - 2 * 86400000).toISOString() },
      { id: 'demo-book-educated', title: 'Educated', author: 'Tara Westover', isbn: '9780399590504', category: 'Memoir', year: 2018, copies: 2, createdAt: new Date(createdAt - 86400000).toISOString() },
      { id: 'demo-book-silent-patient', title: 'The Silent Patient', author: 'Alex Michaelides', isbn: '9781250301697', category: 'Mystery', year: 2019, copies: 1, createdAt: new Date(createdAt).toISOString() }
    ];
    const loans = [
      {
        id: 'demo-loan-overdue', bookId: 'demo-book-atomic-habits', memberId: members[0].id,
        bookTitle: 'Atomic Habits', memberName: members[0].name, memberEmail: members[0].email,
        issuedAt: addDays(today, -21), dueAt: addDays(today, -7), returnedAt: null
      },
      {
        id: 'demo-loan-returned', bookId: 'demo-book-hobbit', memberId: members[1].id,
        bookTitle: 'The Hobbit', memberName: members[1].name, memberEmail: members[1].email,
        issuedAt: addDays(today, -18), dueAt: addDays(today, -4), returnedAt: addDays(today, -4)
      }
    ];
    localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
    localStorage.setItem(MEMBERS_KEY, JSON.stringify(members));
    localStorage.setItem(LOANS_KEY, JSON.stringify(loans));
  }

  localStorage.setItem(DEMO_DATA_KEY, 'true');
};

const initApp = () => {
  const loginForm = document.getElementById('loginForm');
  const loginScreen = document.getElementById('loginScreen');
  const appShell = document.getElementById('appShell');
  const logoutBtn = document.getElementById('logoutBtn');
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const booksTableBody = document.getElementById('booksTableBody');
  const membersTableBody = document.getElementById('membersTableBody');
  const loansTableBody = document.getElementById('loansTableBody');

  if (!loginForm || !loginScreen || !appShell) {
    return;
  }

  seedDemoDataWhenEmpty();
  let books = readRecords(BOOKS_KEY);
  let members = readRecords(MEMBERS_KEY);
  let loans = readRecords(LOANS_KEY);
  let profile = (() => {
    try {
      return JSON.parse(localStorage.getItem(PROFILE_KEY)) || {};
    } catch {
      return {};
    }
  })();
  profile = {
    name: profile.name || 'John Doe',
    email: profile.email || VALID_EMAIL,
    phone: profile.phone || '',
    role: 'Administrator'
  };
  let readNotifications = (() => {
    try {
      const ids = JSON.parse(localStorage.getItem(READ_NOTIFICATIONS_KEY) || '[]');
      return new Set(Array.isArray(ids) ? ids : []);
    } catch {
      return new Set();
    }
  })();
  let activeRecord = null;

  if (!localStorage.getItem(PROFILE_KEY)) {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }

  const activeLoans = () => loans.filter((loan) => !loan.returnedAt);
  const issuedCopies = (bookId) => activeLoans().filter((loan) => loan.bookId === bookId).length;
  const availableCopies = (book) => Math.max(0, Number(book.copies || 0) - issuedCopies(book.id));
  const loanFine = (loan) => countLateDays(loan.dueAt, loan.returnedAt || dateToString(new Date())) * FINE_PER_DAY;
  const loanIsOverdue = (loan) => !loan.returnedAt && loan.dueAt < dateToString(new Date());

  const saveRecords = () => {
    try {
      localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
      localStorage.setItem(MEMBERS_KEY, JSON.stringify(members));
      localStorage.setItem(LOANS_KEY, JSON.stringify(loans));
      return true;
    } catch {
      alert('Your changes could not be saved in this browser.');
      return false;
    }
  };

  const setCellText = (row, value) => {
    const cell = document.createElement('td');
    cell.textContent = value === 0 ? '0' : (value || '—');
    row.append(cell);
    return cell;
  };

  const addActionButton = (cell, label, action, id) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'table-action';
    button.textContent = label;
    button.dataset[action] = id;
    button.setAttribute('aria-label', `${label} record`);
    cell.append(button);
  };

  const renderBooks = () => {
    if (!booksTableBody) return;
    const query = document.getElementById('bookSearch').value.trim().toLocaleLowerCase();
    const categoryFilter = document.getElementById('bookCategoryFilter').value;
    const availabilityFilter = document.getElementById('bookAvailabilityFilter').value;
    const sortBy = document.getElementById('bookSort').value;
    const categorySelect = document.getElementById('bookCategoryFilter');
    const selectedCategory = categorySelect.value;
    const categories = [...new Set(books.map((book) => book.category).filter(Boolean))]
      .sort((first, second) => first.localeCompare(second));

    categorySelect.replaceChildren(new Option('All categories', ''));
    categories.forEach((category) => categorySelect.add(new Option(category, category)));
    categorySelect.value = categories.includes(selectedCategory) ? selectedCategory : '';

    const filteredBooks = books.filter((book) => {
      const searchable = [book.title, book.author, book.isbn, book.category]
        .some((value) => String(value || '').toLocaleLowerCase().includes(query));
      const categoryMatches = !categoryFilter || book.category === categoryFilter;
      const remainingCopies = availableCopies(book);
      const stockMatches = availabilityFilter === 'available'
        ? remainingCopies > 0
        : availabilityFilter !== 'unavailable' || remainingCopies === 0;
      return searchable && categoryMatches && stockMatches;
    });
    if (sortBy === 'recent') {
      filteredBooks.sort((first, second) => {
        if (first.createdAt && second.createdAt) return second.createdAt.localeCompare(first.createdAt);
        return books.indexOf(second) - books.indexOf(first);
      });
    } else if (sortBy === 'year') {
      filteredBooks.sort((first, second) => (Number(second.year) || 0) - (Number(first.year) || 0));
    } else {
      const sortField = sortBy === 'author' ? 'author' : sortBy === 'category' ? 'category' : 'title';
      filteredBooks.sort((first, second) => String(first[sortField] || '').localeCompare(String(second[sortField] || ''), undefined, { sensitivity: 'base' }));
    }

    booksTableBody.replaceChildren();
    if (!filteredBooks.length) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 7;
      cell.className = 'empty-state';
      cell.textContent = books.length ? 'No books match your search or filters.' : 'No books yet. Add a book to start your catalog.';
      row.append(cell);
      booksTableBody.append(row);
    } else {
      filteredBooks.forEach((book) => {
        const row = document.createElement('tr');
        setCellText(row, book.title);
        setCellText(row, book.author);
        setCellText(row, book.isbn);
        setCellText(row, book.category);
        setCellText(row, book.year);
        setCellText(row, `${availableCopies(book)} / ${book.copies}`);
        const actions = document.createElement('td');
        actions.className = 'actions-cell';
        if (availableCopies(book) > 0 && members.length > 0) {
          addActionButton(actions, 'Issue', 'issueBook', book.id);
        }
        addActionButton(actions, 'Edit', 'editBook', book.id);
        addActionButton(actions, 'Delete', 'deleteBook', book.id);
        row.append(actions);
        booksTableBody.append(row);
      });
    }

    document.getElementById('bookResultCount').textContent = `${filteredBooks.length} ${filteredBooks.length === 1 ? 'book' : 'books'}`;
    const recentBooks = document.getElementById('recentBooksList');
    recentBooks.replaceChildren();
    [...books].sort((first, second) => {
      if (first.createdAt && second.createdAt) return second.createdAt.localeCompare(first.createdAt);
      return books.indexOf(second) - books.indexOf(first);
    }).slice(0, 4).forEach((book) => {
      const item = document.createElement('li');
      const details = document.createElement('div');
      const title = document.createElement('strong');
      const category = document.createElement('small');
      const copies = document.createElement('span');
      title.textContent = book.title;
      category.textContent = book.category;
      copies.textContent = `${availableCopies(book)} available`;
      details.append(title, category);
      item.append(details, copies);
      recentBooks.append(item);
    });
    if (!books.length) {
      const item = document.createElement('li');
      item.className = 'empty-list';
      item.textContent = 'No books have been added yet.';
      recentBooks.append(item);
    }

    renderDashboard();
  };

  const renderMembers = () => {
    if (!membersTableBody) return;
    const query = document.getElementById('memberSearch').value.trim().toLocaleLowerCase();
    const filteredMembers = members.filter((member) =>
      [member.name, member.email, member.phone]
        .some((value) => String(value || '').toLocaleLowerCase().includes(query)));

    membersTableBody.replaceChildren();
    if (!filteredMembers.length) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 6;
      cell.className = 'empty-state';
      cell.textContent = members.length ? 'No members match your search.' : 'No members yet. Add a member to start your directory.';
      row.append(cell);
      membersTableBody.append(row);
    } else {
      filteredMembers.forEach((member) => {
        const row = document.createElement('tr');
        setCellText(row, member.name);
        setCellText(row, member.email);
        setCellText(row, member.phone);
        setCellText(row, member.joinedAt);
        const memberBooks = document.createElement('td');
        memberBooks.className = 'member-loans-cell';
        const currentLoans = activeLoans().filter((loan) => loan.memberId === member.id);
        if (currentLoans.length) {
          const loanList = document.createElement('ul');
          loanList.className = 'member-loan-list';
          currentLoans.forEach((loan) => {
            const item = document.createElement('li');
            const title = document.createElement('strong');
            const due = document.createElement('small');
            title.textContent = loan.bookTitle;
            due.textContent = `Due ${formatDate(loan.dueAt)}${loanIsOverdue(loan) ? ` · Overdue · $${loanFine(loan).toFixed(2)} fine` : ''}`;
            item.append(title, due);
            loanList.append(item);
          });
          memberBooks.append(loanList);
        } else {
          memberBooks.textContent = 'No books currently issued';
          memberBooks.classList.add('member-loans-empty');
        }
        row.append(memberBooks);
        const actions = document.createElement('td');
        actions.className = 'actions-cell';
        if (books.some((book) => availableCopies(book) > 0)) {
          addActionButton(actions, 'Issue book', 'issueForMember', member.id);
        }
        addActionButton(actions, 'Edit', 'editMember', member.id);
        addActionButton(actions, 'Delete', 'deleteMember', member.id);
        row.append(actions);
        membersTableBody.append(row);
      });
    }
    document.getElementById('memberResultCount').textContent = `${filteredMembers.length} ${filteredMembers.length === 1 ? 'member' : 'members'}`;
    renderDashboard();
  };

  const renderDashboard = () => {
    const totalCopies = books.reduce((total, book) => total + (Number(book.copies) || 0), 0);
    const issued = activeLoans().length;
    const overdue = activeLoans().filter(loanIsOverdue);
    document.getElementById('totalBooksStat').textContent = totalCopies.toLocaleString();
    document.getElementById('availableBooksStat').textContent = Math.max(0, totalCopies - issued).toLocaleString();
    document.getElementById('issuedBooksStat').textContent = issued.toLocaleString();
    document.getElementById('totalMembersStat').textContent = members.length.toLocaleString();
    document.getElementById('overdueBooksStat').textContent = overdue.length.toLocaleString();
    document.getElementById('overdueSidebarStat').textContent = overdue.length.toLocaleString();

    const overdueSummary = document.getElementById('overdueSummaryList');
    overdueSummary.replaceChildren();
    overdue.slice(0, 4).forEach((loan) => {
      const item = document.createElement('li');
      const dot = document.createElement('span');
      dot.className = 'dot orange';
      const details = document.createElement('div');
      const title = document.createElement('strong');
      const member = document.createElement('small');
      const fine = document.createElement('time');
      title.textContent = loan.bookTitle;
      member.textContent = loan.memberName;
      fine.textContent = `$${loanFine(loan).toFixed(2)} fine`;
      details.append(title, member);
      item.append(dot, details, fine);
      overdueSummary.append(item);
    });
    if (!overdue.length) {
      const item = document.createElement('li');
      item.className = 'empty-list';
      item.textContent = 'No overdue books.';
      overdueSummary.append(item);
    }

    const recentLoans = loans.slice(-5).reverse();
    const dashboardLoansBody = document.getElementById('dashboardLoansBody');
    dashboardLoansBody.replaceChildren();
    recentLoans.forEach((loan) => {
      const row = document.createElement('tr');
      setCellText(row, loan.memberName);
      setCellText(row, loan.bookTitle);
      setCellText(row, formatDate(loan.issuedAt));
      setCellText(row, formatDate(loan.dueAt));
      setCellText(row, `$${loanFine(loan).toFixed(2)}`);
      dashboardLoansBody.append(row);
    });
    if (!recentLoans.length) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 5;
      cell.className = 'empty-state';
      cell.textContent = 'No books have been issued yet.';
      row.append(cell);
      dashboardLoansBody.append(row);
    }
    renderNotifications();
  };

  const renderLoans = () => {
    if (!loansTableBody) return;
    const query = document.getElementById('loanSearch').value.trim().toLocaleLowerCase();
    const statusFilter = document.getElementById('loanStatusFilter').value;
    const filteredLoans = [...loans].reverse().filter((loan) => {
      const searchable = [loan.bookTitle, loan.memberName, loan.memberEmail]
        .some((value) => String(value || '').toLocaleLowerCase().includes(query));
      const statusMatches = statusFilter === 'all'
        || (statusFilter === 'returned' ? Boolean(loan.returnedAt) : !loan.returnedAt);
      return searchable && statusMatches;
    });

    loansTableBody.replaceChildren();
    if (!filteredLoans.length) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 9;
      cell.className = 'empty-state';
      cell.textContent = loans.length ? 'No loans match your search or filter.' : 'No loans yet. Issue a book from the Books page.';
      row.append(cell);
      loansTableBody.append(row);
    } else {
      filteredLoans.forEach((loan) => {
        const row = document.createElement('tr');
        const lateDays = countLateDays(loan.dueAt, loan.returnedAt || dateToString(new Date()));
        const status = loan.returnedAt ? 'Returned' : loanIsOverdue(loan) ? 'Overdue' : 'Issued';
        setCellText(row, loan.bookTitle);
        setCellText(row, `${loan.memberName} (${loan.memberEmail})`);
        setCellText(row, formatDate(loan.issuedAt));
        setCellText(row, formatDate(loan.dueAt));
        setCellText(row, formatDate(loan.returnedAt));
        setCellText(row, lateDays);
        setCellText(row, `$${loanFine(loan).toFixed(2)}`);
        const statusCell = document.createElement('td');
        const statusBadge = document.createElement('span');
        statusBadge.className = `status ${status === 'Returned' ? 'active' : status === 'Overdue' ? 'danger' : 'pending'}`;
        statusBadge.textContent = status;
        statusCell.append(statusBadge);
        row.append(statusCell);
        const actions = document.createElement('td');
        if (!loan.returnedAt) addActionButton(actions, 'Return', 'returnLoan', loan.id);
        row.append(actions);
        loansTableBody.append(row);
      });
    }
    document.getElementById('loanResultCount').textContent = `${filteredLoans.length} ${filteredLoans.length === 1 ? 'loan' : 'loans'}`;
  };

  const getNotifications = () => {
    const today = dateToString(new Date());
    const reminderLimit = addDays(today, 3);
    return activeLoans()
      .filter((loan) => loan.dueAt <= reminderLimit)
      .map((loan) => ({
        id: loan.id,
        loan,
        overdue: loan.dueAt < today,
        lateDays: countLateDays(loan.dueAt, today),
        daysUntilDue: Math.max(0, Math.floor((Date.parse(`${loan.dueAt}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000))
      }))
      .sort((first, second) => first.loan.dueAt.localeCompare(second.loan.dueAt));
  };

  const renderNotifications = () => {
    const list = document.getElementById('notificationList');
    const notifications = getNotifications();
    const unreadCount = notifications.filter((notification) => !readNotifications.has(notification.id)).length;
    const count = document.getElementById('notificationCount');
    count.textContent = unreadCount > 9 ? '9+' : String(unreadCount);
    count.classList.toggle('hidden', unreadCount === 0);
    list.replaceChildren();

    notifications.forEach((notification) => {
      const item = document.createElement('li');
      const button = document.createElement('button');
      const dot = document.createElement('span');
      const details = document.createElement('span');
      const title = document.createElement('strong');
      const message = document.createElement('small');
      button.type = 'button';
      button.className = `notification-item${readNotifications.has(notification.id) ? '' : ' unread'}`;
      button.dataset.notificationId = notification.id;
      dot.className = 'notification-dot';
      title.textContent = notification.overdue ? `${notification.loan.bookTitle} is overdue` : `${notification.loan.bookTitle} is due soon`;
      message.textContent = notification.overdue
        ? `${notification.loan.memberName} · ${notification.lateDays} late days · $${(notification.lateDays * FINE_PER_DAY).toFixed(2)} fine`
        : `${notification.loan.memberName} · due ${formatDate(notification.loan.dueAt)}${notification.daysUntilDue === 0 ? ' (today)' : ''}`;
      details.append(title, message);
      button.append(dot, details);
      item.append(button);
      list.append(item);
    });

    if (!notifications.length) {
      const item = document.createElement('li');
      item.className = 'notification-empty';
      item.textContent = 'No due or overdue loans right now.';
      list.append(item);
    }
  };

  const updateProfileDisplay = () => {
    const initials = profile.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toLocaleUpperCase() || 'AD';
    document.getElementById('profileAvatar').textContent = initials;
    document.getElementById('profilePageAvatar').textContent = initials;
    document.getElementById('topbarProfileName').textContent = profile.name;
    document.getElementById('topbarProfileRole').textContent = profile.role;
    document.getElementById('profilePageName').textContent = profile.name;
    document.getElementById('profilePageRole').textContent = profile.role;
    document.getElementById('profileName').value = profile.name;
    document.getElementById('profileEmail').value = profile.email;
    document.getElementById('profilePhone').value = profile.phone;
  };

  const applyTheme = (theme, persist = true) => {
    const activeTheme = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.dataset.theme = activeTheme;
    const toggle = document.getElementById('themeToggle');
    const nextTheme = activeTheme === 'dark' ? 'light' : 'dark';
    toggle.textContent = activeTheme === 'dark' ? '☀' : '☾';
    toggle.setAttribute('aria-label', `Switch to ${nextTheme} mode`);
    toggle.title = `Switch to ${nextTheme} mode`;
    if (persist) localStorage.setItem(THEME_KEY, activeTheme);
  };

  const showPage = (pageId) => {
    document.querySelectorAll('.page-view').forEach((view) => view.classList.toggle('hidden', view.id !== pageId));
    document.querySelectorAll('.nav-item[data-page]').forEach((item) => item.classList.toggle('active', item.dataset.page === pageId));
    if (sidebar) sidebar.classList.remove('open');
    if (pageId === 'loansView') renderLoans();
  };

  const fieldDefinitions = {
    book: [
      { name: 'title', label: 'Title', required: true },
      { name: 'author', label: 'Author', required: true },
      { name: 'isbn', label: 'ISBN', required: true },
      { name: 'category', label: 'Category', required: true },
      { name: 'year', label: 'Publication year', type: 'number', min: '0', max: '9999' },
      { name: 'copies', label: 'Number of copies', type: 'number', min: '0', required: true }
    ],
    member: [
      { name: 'name', label: 'Full name', required: true },
      { name: 'email', label: 'Email address', type: 'email', required: true },
      { name: 'phone', label: 'Phone number', type: 'tel', required: true },
      { name: 'joinedAt', label: 'Membership date', type: 'date', required: true }
    ]
  };

  const recordDialog = document.getElementById('recordDialog');
  const recordForm = document.getElementById('recordForm');
  const issueDialog = document.getElementById('issueDialog');
  const issueForm = document.getElementById('issueForm');
  const closeDialog = () => recordDialog.close();

  const updateIssueDueDate = () => {
    const issueDate = document.getElementById('issueDate').value;
    document.getElementById('issueDueDate').textContent = issueDate ? formatDate(addDays(issueDate, LOAN_PERIOD_DAYS)) : 'Select an issue date';
  };

  const openIssueDialog = (bookId = null, memberId = null) => {
    const availableBooks = books.filter((book) => availableCopies(book) > 0);
    if (!availableBooks.length) {
      alert('There are no available copies to issue.');
      return;
    }
    if (!members.length) {
      alert('Add a member before issuing a book.');
      return;
    }
    const bookSelect = document.getElementById('issueBook');
    bookSelect.replaceChildren();
    availableBooks.forEach((book) => {
      bookSelect.add(new Option(`${book.title} · ${availableCopies(book)} available`, book.id));
    });
    bookSelect.value = availableBooks.some((book) => book.id === bookId) ? bookId : availableBooks[0].id;
    const memberSelect = document.getElementById('issueMember');
    memberSelect.replaceChildren();
    members.forEach((member) => {
      const option = new Option(`${member.name} · ${member.email}`, member.id);
      memberSelect.add(option);
    });
    memberSelect.value = members.some((member) => member.id === memberId) ? memberId : members[0].id;
    document.getElementById('issueDate').value = dateToString(new Date());
    updateIssueDueDate();
    issueDialog.showModal();
  };

  const openRecordDialog = (type, record = null) => {
    activeRecord = { type, id: record ? record.id : null };
    const isBook = type === 'book';
    document.getElementById('recordDialogType').textContent = isBook ? 'Book inventory' : 'Member directory';
    document.getElementById('recordDialogTitle').textContent = `${record ? 'Edit' : 'Add'} ${type}`;
    document.getElementById('saveRecordButton').textContent = `Save ${type}`;
    const fields = document.getElementById('recordDialogFields');
    fields.replaceChildren();

    fieldDefinitions[type].forEach((definition) => {
      const label = document.createElement('label');
      label.className = 'form-field';
      label.htmlFor = `record-${definition.name}`;
      const labelText = document.createElement('span');
      labelText.textContent = definition.label;
      const input = document.createElement('input');
      input.id = label.htmlFor;
      input.name = definition.name;
      input.type = definition.type || 'text';
      input.required = Boolean(definition.required);
      if (definition.min !== undefined) input.min = definition.min;
      if (definition.max !== undefined) input.max = definition.max;
      input.value = record ? (record[definition.name] ?? '') : '';
      if (!record && definition.name === 'joinedAt') {
        input.value = new Date().toISOString().slice(0, 10);
      }
      label.append(labelText, input);
      if (isBook && definition.name === 'category') {
        const categoryList = document.createElement('datalist');
        categoryList.id = 'bookCategoryOptions';
        [...new Set(books.map((book) => book.category).filter(Boolean))].forEach((category) => {
          categoryList.append(new Option(category, category));
        });
        input.setAttribute('list', categoryList.id);
        fields.append(label, categoryList);
      } else {
        fields.append(label);
      }
    });

    recordDialog.showModal();
    fields.querySelector('input')?.focus();
  };

  document.querySelectorAll('[data-page]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      showPage(link.dataset.page);
    });
  });

  document.querySelectorAll('[data-add]').forEach((button) => {
    button.addEventListener('click', () => openRecordDialog(button.dataset.add));
  });

  document.getElementById('bookSearch').addEventListener('input', renderBooks);
  document.getElementById('bookCategoryFilter').addEventListener('change', renderBooks);
  document.getElementById('bookAvailabilityFilter').addEventListener('change', renderBooks);
  document.getElementById('bookSort').addEventListener('change', renderBooks);
  document.getElementById('memberSearch').addEventListener('input', renderMembers);
  document.getElementById('loanSearch').addEventListener('input', renderLoans);
  document.getElementById('loanStatusFilter').addEventListener('change', renderLoans);
  document.getElementById('issueDate').addEventListener('input', updateIssueDueDate);
  document.getElementById('themeToggle').addEventListener('click', () => {
    applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  });

  const notificationsButton = document.getElementById('notificationsButton');
  const notificationPopover = document.getElementById('notificationPopover');
  notificationsButton.addEventListener('click', () => {
    notificationPopover.hidden = !notificationPopover.hidden;
    notificationsButton.setAttribute('aria-expanded', String(!notificationPopover.hidden));
  });

  document.getElementById('markNotificationsRead').addEventListener('click', () => {
    getNotifications().forEach((notification) => readNotifications.add(notification.id));
    localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify([...readNotifications]));
    renderNotifications();
  });

  document.getElementById('notificationList').addEventListener('click', (event) => {
    const button = event.target.closest('[data-notification-id]');
    if (!button) return;
    const notification = getNotifications().find((item) => item.id === button.dataset.notificationId);
    readNotifications.add(button.dataset.notificationId);
    localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify([...readNotifications]));
    renderNotifications();
    notificationPopover.hidden = true;
    notificationsButton.setAttribute('aria-expanded', 'false');
    if (notification) {
      document.getElementById('loanSearch').value = notification.loan.bookTitle;
      document.getElementById('loanStatusFilter').value = 'active';
    }
    showPage('loansView');
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.notification-wrap') && !notificationPopover.hidden) {
      notificationPopover.hidden = true;
      notificationsButton.setAttribute('aria-expanded', 'false');
    }
  });

  document.getElementById('profileForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const values = Object.fromEntries(new FormData(form).entries());
    profile = {
      name: values.name.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      role: 'Administrator'
    };
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      updateProfileDisplay();
      document.getElementById('profileSaveStatus').textContent = 'Profile saved.';
    } catch {
      document.getElementById('profileSaveStatus').textContent = 'Could not save profile in this browser.';
    }
  });

  booksTableBody?.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.editBook) {
      const record = books.find((book) => book.id === button.dataset.editBook);
      if (record) openRecordDialog('book', record);
    } else if (button.dataset.issueBook) {
      openIssueDialog(button.dataset.issueBook);
    } else if (button.dataset.deleteBook) {
      const record = books.find((book) => book.id === button.dataset.deleteBook);
      if (record && issuedCopies(record.id) > 0) {
        alert('Return all active copies of this book before deleting it.');
      } else if (record && confirm(`Delete "${record.title}" from the catalog?`)) {
        books = books.filter((book) => book.id !== record.id);
        if (saveRecords()) {
          renderBooks();
          renderMembers();
        }
      }
    }
  });

  membersTableBody?.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.editMember) {
      const record = members.find((member) => member.id === button.dataset.editMember);
      if (record) openRecordDialog('member', record);
    } else if (button.dataset.issueForMember) {
      openIssueDialog(null, button.dataset.issueForMember);
    } else if (button.dataset.deleteMember) {
      const record = members.find((member) => member.id === button.dataset.deleteMember);
      if (record && activeLoans().some((loan) => loan.memberId === record.id)) {
        alert('Return all books issued to this member before deleting the member.');
      } else if (record && confirm(`Delete ${record.name} from the member directory?`)) {
        members = members.filter((member) => member.id !== record.id);
        if (saveRecords()) {
          renderMembers();
          renderBooks();
        }
      }
    }
  });

  recordForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!activeRecord || !recordForm.reportValidity()) return;
    const values = Object.fromEntries(new FormData(recordForm).entries());
    Object.keys(values).forEach((key) => {
      if (typeof values[key] === 'string') values[key] = values[key].trim();
    });
    if (activeRecord.type === 'book') {
      values.copies = Number(values.copies);
      values.year = values.year ? Number(values.year) : '';
      if (activeRecord.id && issuedCopies(activeRecord.id) > values.copies) {
        alert('Total copies cannot be less than the number currently issued.');
        return;
      }
      const duplicateIsbn = books.some((book) => book.id !== activeRecord.id && book.isbn.toLocaleLowerCase() === values.isbn.toLocaleLowerCase());
      if (duplicateIsbn) {
        alert('A book with this ISBN is already in the catalog.');
        return;
      }
      if (activeRecord.id) {
        books = books.map((book) => book.id === activeRecord.id ? { ...book, ...values } : book);
      } else {
        books.push({ id: createId(), createdAt: new Date().toISOString(), ...values });
      }
    } else {
      const duplicateEmail = members.some((member) => member.id !== activeRecord.id && member.email.toLocaleLowerCase() === values.email.toLocaleLowerCase());
      if (duplicateEmail) {
        alert('A member with this email address is already registered.');
        return;
      }
      if (activeRecord.id) {
        members = members.map((member) => member.id === activeRecord.id ? { ...member, ...values } : member);
      } else {
        members.push({ id: createId(), ...values });
      }
    }

    if (saveRecords()) {
      closeDialog();
      renderBooks();
      renderMembers();
      renderLoans();
    }
  });

  issueForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!issueForm.reportValidity()) return;
    const book = books.find((record) => record.id === document.getElementById('issueBook').value);
    const member = members.find((record) => record.id === document.getElementById('issueMember').value);
    const issuedAt = document.getElementById('issueDate').value;
    if (!book || !member || availableCopies(book) < 1) {
      alert('This book is no longer available. Refresh the book list and try again.');
      issueDialog.close();
      return;
    }
    loans.push({
      id: createId(),
      bookId: book.id,
      memberId: member.id,
      bookTitle: book.title,
      memberName: member.name,
      memberEmail: member.email,
      issuedAt,
      dueAt: addDays(issuedAt, LOAN_PERIOD_DAYS),
      returnedAt: null
    });
    if (saveRecords()) {
      issueDialog.close();
      renderBooks();
      renderMembers();
      renderLoans();
    }
  });

  loansTableBody?.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button || !button.dataset.returnLoan) return;
    const loan = loans.find((record) => record.id === button.dataset.returnLoan);
    if (!loan || loan.returnedAt) return;
    const fine = loanFine(loan);
    const fineMessage = fine > 0 ? ` The overdue fine is $${fine.toFixed(2)}.` : '';
    if (!confirm(`Record the return of "${loan.bookTitle}" from ${loan.memberName}?${fineMessage}`)) return;
    loan.returnedAt = dateToString(new Date());
    if (saveRecords()) {
      renderBooks();
      renderMembers();
      renderLoans();
    }
  });

  document.getElementById('closeRecordDialog').addEventListener('click', closeDialog);
  document.getElementById('cancelRecordDialog').addEventListener('click', closeDialog);
  document.getElementById('closeIssueDialog').addEventListener('click', () => issueDialog.close());
  document.getElementById('cancelIssueDialog').addEventListener('click', () => issueDialog.close());

  const applyAuthState = (loggedIn) => {
    loginScreen.classList.toggle('hidden', loggedIn);
    appShell.classList.toggle('hidden', !loggedIn);
    if (loggedIn) {
      localStorage.setItem('lmsLoggedIn', 'true');
    } else {
      localStorage.removeItem('lmsLoggedIn');
    }
  };

  const loggedIn = localStorage.getItem('lmsLoggedIn') === 'true';
  applyAuthState(loggedIn);
  applyTheme(localStorage.getItem(THEME_KEY) || 'light', false);
  updateProfileDisplay();
  renderBooks();
  renderMembers();
  renderLoans();

  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      alert('Please enter your email and password.');
      return;
    }

    if (email !== profile.email || password !== VALID_PASSWORD) {
      alert('Invalid email or password.');
      return;
    }

    applyAuthState(true);
    loginForm.reset();
  });

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      applyAuthState(false);
      loginForm.reset();
      if (emailInput) emailInput.focus();
    });
  }

  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }
};

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
}